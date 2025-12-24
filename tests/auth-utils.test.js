/**
 * Unit tests for auth-utils.js
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
    auth, 
    db, 
    analytics 
} from '../auth/firebase-config.js';
import { 
    registerUser 
} from '../auth/auth-utils.js';
import { 
    createUserWithEmailAndPassword,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { 
    doc, 
    setDoc,
    Timestamp
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { logEvent } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js";

describe('auth-utils.js', () => {

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('registerUser', () => {
        it('should create a user and a Firestore profile on successful registration', async () => {
            // Arrange
            const mockUser = { uid: 'test-uid-123', email: 'test@example.com' };
            const mockUserCredential = { user: mockUser };
            
            // Mock the return value of the Firebase Auth function
            createUserWithEmailAndPassword.mockResolvedValue(mockUserCredential);
            updateProfile.mockResolvedValue(undefined);
            setDoc.mockResolvedValue(undefined);

            // Act
            const result = await registerUser('test@example.com', 'password123', 'Test User');

            // Assert
            expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(auth, 'test@example.com', 'password123');
            expect(updateProfile).toHaveBeenCalledWith(mockUser, { displayName: 'Test User' });
            expect(setDoc).toHaveBeenCalled();
            
            // Get the arguments passed to setDoc
            const setDocArgs = setDoc.mock.calls[0];
            const firestoreDocRef = setDocArgs[0];
            const profileData = setDocArgs[1];

            // Check that the doc ref is correct
            expect(firestoreDocRef.id).toBe(mockUser.uid);

            // Check that the profile data is correct
            expect(profileData.uid).toBe(mockUser.uid);
            expect(profileData.email).toBe('test@example.com');
            expect(profileData.displayName).toBe('Test User');
            expect(profileData.role).toBe('guest');
            expect(profileData.createdAt).toBeInstanceOf(Object); // Timestamp mock

            expect(logEvent).toHaveBeenCalledWith(analytics, 'sign_up', {
                method: 'email',
                user_id: mockUser.uid
            });

            expect(result.success).toBe(true);
            expect(result.user).toEqual(mockUser);
        });

        it('should return an error if registration fails', async () => {
            // Arrange
            const errorMessage = 'Firebase auth error';
            createUserWithEmailAndPassword.mockRejectedValue(new Error(errorMessage));

            // Act
            const result = await registerUser('test@example.com', 'password123', 'Test User');

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBe(errorMessage);
            expect(setDoc).not.toHaveBeenCalled();
            expect(logEvent).not.toHaveBeenCalled();
        });
    });

    describe('loginWithEmail', () => {
        it('should sign in a user with correct credentials', async () => {
            // Arrange
            const mockUser = { uid: 'test-uid-123', email: 'test@example.com' };
            const mockUserCredential = { user: mockUser };
            signInWithEmailAndPassword.mockResolvedValue(mockUserCredential);

            // Act
            const result = await loginWithEmail('test@example.com', 'password123');

            // Assert
            expect(signInWithEmailAndPassword).toHaveBeenCalledWith(auth, 'test@example.com', 'password123');
            expect(logEvent).toHaveBeenCalledWith(analytics, 'login', {
                method: 'email',
                user_id: mockUser.uid
            });
            expect(result.success).toBe(true);
            expect(result.user).toEqual(mockUser);
        });

        it('should return a specific error for user-not-found', async () => {
            // Arrange
            const error = { code: 'auth/user-not-found' };
            signInWithEmailAndPassword.mockRejectedValue(error);

            // Act
            const result = await loginWithEmail('nonexistent@example.com', 'password123');

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBe('No account found with this email.');
            expect(logEvent).not.toHaveBeenCalled();
        });

        it('should return a specific error for wrong-password', async () => {
            // Arrange
            const error = { code: 'auth/wrong-password' };
            signInWithEmailAndPassword.mockRejectedValue(error);

            // Act
            const result = await loginWithEmail('test@example.com', 'wrongpassword');

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBe('Incorrect password.');
            expect(logEvent).not.toHaveBeenCalled();
        });

        it('should return a generic error for other failures', async () => {
            // Arrange
            const error = { code: 'auth/some-other-error' };
            signInWithEmailAndPassword.mockRejectedValue(error);

            // Act
            const result = await loginWithEmail('test@example.com', 'password123');

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBe('Login failed. Please check your credentials.');
            expect(logEvent).not.toHaveBeenCalled();
        });
    });

    describe('loginWithGoogle', () => {
        it('should sign in an existing user', async () => {
            // Arrange
            const mockUser = { uid: 'google-uid-456', email: 'google@example.com' };
            const mockUserCredential = { user: mockUser };
            signInWithPopup.mockResolvedValue(mockUserCredential);
            getDoc.mockResolvedValue({ exists: () => true, data: () => ({ role: 'student' }) });

            // Act
            const result = await loginWithGoogle();

            // Assert
            expect(signInWithPopup).toHaveBeenCalled();
            expect(getDoc).toHaveBeenCalled();
            expect(logEvent).toHaveBeenCalledWith(analytics, 'login', {
                method: 'google',
                user_id: mockUser.uid
            });
            expect(result.success).toBe(true);
            expect(result.user).toEqual(mockUser);
        });

        it('should return needsRegistration for a new user', async () => {
            // Arrange
            const mockUser = { uid: 'new-google-uid-789', email: 'new@google.com' };
            const mockUserCredential = { user: mockUser };
            signInWithPopup.mockResolvedValue(mockUserCredential);
            getDoc.mockResolvedValue({ exists: () => false });

            // Act
            const result = await loginWithGoogle();

            // Assert
            expect(result.success).toBe(false);
            expect(result.needsRegistration).toBe(true);
            expect(result.user).toEqual(mockUser);
            expect(result.error).toBe('first_time_google_user');
            expect(logEvent).not.toHaveBeenCalled();
        });

        it('should return a cancellation error if the popup is closed', async () => {
            // Arrange
            const error = { code: 'auth/popup-closed-by-user' };
            signInWithPopup.mockRejectedValue(error);

            // Act
            const result = await loginWithGoogle();

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBe('Login cancelled.');
        });

        it('should return a generic error for other failures', async () => {
            // Arrange
            const error = { code: 'auth/some-other-error' };
            signInWithPopup.mockRejectedValue(error);

            // Act
            const result = await loginWithGoogle();

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBe('Google sign-in failed. Please try again.');
        });
    });

    describe('completeGoogleRegistration', () => {
        it('should create a new user profile for the current user', async () => {
            // Arrange
            const mockUser = { 
                uid: 'new-google-uid-789', 
                email: 'new@google.com', 
                displayName: 'New Google User' 
            };
            auth.currentUser = mockUser;
            setDoc.mockResolvedValue(undefined);

            // Act
            const result = await completeGoogleRegistration();

            // Assert
            expect(setDoc).toHaveBeenCalled();
            const setDocArgs = setDoc.mock.calls[0];
            const profileData = setDocArgs[1];
            
            expect(profileData.role).toBe('guest');
            expect(profileData.displayName).toBe(mockUser.displayName);

            expect(logEvent).toHaveBeenCalledWith(analytics, 'sign_up', {
                method: 'google',
                user_id: mockUser.uid
            });
            expect(result.success).toBe(true);
        });

        it('should return an error if no user is signed in', async () => {
            // Arrange
            auth.currentUser = null;

            // Act
            const result = await completeGoogleRegistration();

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBe('No user signed in');
            expect(setDoc).not.toHaveBeenCalled();
        });

        it('should return an error if writing to Firestore fails', async () => {
            // Arrange
            const mockUser = { uid: 'test-uid', email: 'test@test.com' };
            auth.currentUser = mockUser;
            const firestoreError = new Error('Firestore write failed');
            setDoc.mockRejectedValue(firestoreError);

            // Act
            const result = await completeGoogleRegistration();

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBe('Firestore write failed');
        });
    });

    describe('logout', () => {
        it('should sign out the user and log the event', async () => {
            // Arrange
            signOut.mockResolvedValue(undefined);

            // Act
            const result = await logout();

            // Assert
            expect(signOut).toHaveBeenCalledWith(auth);
            expect(logEvent).toHaveBeenCalledWith(analytics, 'logout');
            expect(result.success).toBe(true);
        });

        it('should return an error if sign out fails', async () => {
            // Arrange
            const logoutError = new Error('Logout failed');
            signOut.mockRejectedValue(logoutError);

            // Act
            const result = await logout();

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBe('Logout failed');
            expect(logEvent).not.toHaveBeenCalled();
        });
    });
});