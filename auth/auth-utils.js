// Authentication Utility Functions
// Handles user registration, login, session management, and data operations

import { auth, db, analytics } from './firebase-config.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import {
    doc,
    setDoc,
    getDoc,
    getDocs,
    collection,
    query,
    where,
    orderBy,
    Timestamp,
    updateDoc,
    arrayUnion
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { logEvent } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js";

// ============================================================================
// REGISTRATION FUNCTIONS
// ============================================================================

/**
 * Register a new user with email/password
 * Includes age verification (must be 13+) for COPPA compliance
 */
export async function registerUser(email, password, displayName, birthdate) {
    try {
        // Verify age (must be 13 or older)
        const age = calculateAge(birthdate);
        if (age < 13) {
            throw new Error('You must be at least 13 years old to register. This is required by COPPA regulations to protect children\'s privacy.');
        }

        // Create Firebase Auth account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update display name
        await updateProfile(user, { displayName: displayName });

        // Create user profile in Firestore
        await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: email,
            displayName: displayName,
            birthdate: birthdate,
            age: age,
            createdAt: Timestamp.now(),
            role: 'guest', // Default role - teachers can upgrade to 'student'
            totalQuizzesTaken: 0,
            averageScore: 0
        });

        // Log registration event
        logEvent(analytics, 'sign_up', {
            method: 'email',
            user_id: user.uid
        });

        return { success: true, user: user };
    } catch (error) {
        console.error('Registration error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Calculate age from birthdate
 */
function calculateAge(birthdate) {
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age;
}

// ============================================================================
// LOGIN FUNCTIONS
// ============================================================================

/**
 * Sign in with email and password
 */
export async function loginWithEmail(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        // Log login event
        logEvent(analytics, 'login', {
            method: 'email',
            user_id: userCredential.user.uid
        });

        return { success: true, user: userCredential.user };
    } catch (error) {
        console.error('Login error:', error);
        let errorMessage = 'Login failed. Please check your credentials.';

        if (error.code === 'auth/user-not-found') {
            errorMessage = 'No account found with this email.';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'Incorrect password.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address.';
        }

        return { success: false, error: errorMessage };
    }
}

/**
 * Sign in with Google (SSO)
 */
export async function loginWithGoogle() {
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Check if user profile exists, create if not
        const userDoc = await getDoc(doc(db, 'users', user.uid));

        if (!userDoc.exists()) {
            // First time Google sign-in - need age verification
            // This should redirect to age verification page
            await signOut(auth);
            return {
                success: false,
                error: 'first_time_google_user',
                message: 'Please complete registration with age verification first.'
            };
        }

        // Verify user is 13+
        const userData = userDoc.data();
        if (userData.age < 13) {
            await signOut(auth);
            return {
                success: false,
                error: 'You must be at least 13 years old to use this platform.'
            };
        }

        // Log login event
        logEvent(analytics, 'login', {
            method: 'google',
            user_id: user.uid
        });

        return { success: true, user: user };
    } catch (error) {
        console.error('Google login error:', error);

        if (error.code === 'auth/popup-closed-by-user') {
            return { success: false, error: 'Login cancelled.' };
        }

        return { success: false, error: 'Google sign-in failed. Please try again.' };
    }
}

/**
 * Complete Google registration with age verification
 */
export async function completeGoogleRegistration(birthdate) {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('No user signed in');
        }

        // Verify age
        const age = calculateAge(birthdate);
        if (age < 13) {
            await signOut(auth);
            throw new Error('You must be at least 13 years old to register.');
        }

        // Create user profile
        await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL || null,
            birthdate: birthdate,
            age: age,
            createdAt: Timestamp.now(),
            role: 'guest', // Default role - teachers can upgrade to 'student'
            totalQuizzesTaken: 0,
            averageScore: 0
        });

        logEvent(analytics, 'sign_up', {
            method: 'google',
            user_id: user.uid
        });

        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Sign out current user
 */
export async function logout() {
    try {
        await signOut(auth);
        logEvent(analytics, 'logout');
        return { success: true };
    } catch (error) {
        console.error('Logout error:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Check if user is authenticated and fetch their profile data
 * Returns a promise that resolves with combined user + profile data or null
 */
export function getCurrentUser() {
    return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            unsubscribe();

            if (!user) {
                resolve(null);
                return;
            }

            // Fetch Firestore profile to get role and other data
            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    // Combine Auth user with Firestore profile data
                    const profileData = userDoc.data();
                    resolve({
                        ...user,
                        uid: user.uid,
                        email: user.email,
                        displayName: profileData.displayName || user.displayName,
                        role: profileData.role,
                        name: profileData.displayName, // Alias for compatibility
                        birthdate: profileData.birthdate,
                        age: profileData.age,
                        school: profileData.school,
                        grade: profileData.grade,
                        bio: profileData.bio,
                        createdAt: profileData.createdAt,
                        totalQuizzesTaken: profileData.totalQuizzesTaken || 0,
                        averageScore: profileData.averageScore || 0
                    });
                } else {
                    // Profile doesn't exist yet, return auth user only
                    resolve(user);
                }
            } catch (error) {
                console.error('Error fetching user profile:', error);
                // Return auth user even if profile fetch fails
                resolve(user);
            }
        });
    });
}

/**
 * Require authentication - redirect to login if not authenticated
 */
export async function requireAuth(redirectUrl = '../auth/login.html') {
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = redirectUrl;
        return null;
    }
    return user;
}

/**
 * Get user profile from Firestore
 */
export async function getUserProfile(uid) {
    try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
            return { success: true, profile: userDoc.data() };
        } else {
            return { success: false, error: 'Profile not found' };
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Check if user is a teacher
 */
export async function isTeacher(uid) {
    const result = await getUserProfile(uid);
    return result.success && result.profile.role === 'teacher';
}

// ============================================================================
// QUIZ SCORE FUNCTIONS
// ============================================================================

/**
 * Save quiz score to Firestore
 */
export async function saveQuizScore(quizId, scoreData) {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('Must be logged in to save scores');
        }

        const quizDocRef = doc(db, 'users', user.uid, 'quizScores', quizId);

        // Prepare score data
        const scoreRecord = {
            quizId: quizId,
            score: scoreData.score,
            totalQuestions: scoreData.totalQuestions,
            percentage: Math.round((scoreData.score / scoreData.totalQuestions) * 100),
            timeSpent: scoreData.timeSpent || 0,
            completedAt: Timestamp.now(),
            answers: scoreData.answers || []
        };

        // Check if quiz was taken before
        const existingDoc = await getDoc(quizDocRef);

        if (existingDoc.exists()) {
            // Update with new attempt
            const existingData = existingDoc.data();
            scoreRecord.attempts = (existingData.attempts || 1) + 1;
            scoreRecord.bestScore = Math.max(existingData.bestScore || 0, scoreData.score);
            scoreRecord.firstAttemptDate = existingData.completedAt;
        } else {
            scoreRecord.attempts = 1;
            scoreRecord.bestScore = scoreData.score;
            scoreRecord.firstAttemptDate = Timestamp.now();
        }

        // Save to Firestore
        await setDoc(quizDocRef, scoreRecord);

        // Update user's total quizzes count and average
        await updateUserStats(user.uid);

        // Log analytics event
        logEvent(analytics, 'quiz_completed', {
            quiz_id: quizId,
            score: scoreData.score,
            percentage: scoreRecord.percentage,
            user_id: user.uid
        });

        return { success: true, scoreRecord: scoreRecord };
    } catch (error) {
        console.error('Error saving quiz score:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get all quiz scores for current user
 */
export async function getUserQuizScores() {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('Must be logged in');
        }

        const scoresRef = collection(db, 'users', user.uid, 'quizScores');
        const scoresSnapshot = await getDocs(scoresRef);

        const scores = [];
        scoresSnapshot.forEach((doc) => {
            scores.push({ id: doc.id, ...doc.data() });
        });

        return { success: true, scores: scores };
    } catch (error) {
        console.error('Error fetching quiz scores:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get specific quiz score
 */
export async function getQuizScore(quizId) {
    try {
        const user = auth.currentUser;
        if (!user) {
            return { success: false, error: 'Not logged in' };
        }

        const scoreDoc = await getDoc(doc(db, 'users', user.uid, 'quizScores', quizId));

        if (scoreDoc.exists()) {
            return { success: true, score: scoreDoc.data() };
        } else {
            return { success: true, score: null }; // Quiz not taken yet
        }
    } catch (error) {
        console.error('Error fetching quiz score:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update user statistics (total quizzes, average score)
 */
async function updateUserStats(uid) {
    try {
        const scoresRef = collection(db, 'users', uid, 'quizScores');
        const scoresSnapshot = await getDocs(scoresRef);

        let totalQuizzes = 0;
        let totalPercentage = 0;

        scoresSnapshot.forEach((doc) => {
            const data = doc.data();
            totalQuizzes++;
            totalPercentage += data.percentage;
        });

        const averageScore = totalQuizzes > 0 ? Math.round(totalPercentage / totalQuizzes) : 0;

        await updateDoc(doc(db, 'users', uid), {
            totalQuizzesTaken: totalQuizzes,
            averageScore: averageScore
        });

        return { success: true };
    } catch (error) {
        console.error('Error updating user stats:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================================
// TEACHER ADMIN FUNCTIONS
// ============================================================================

/**
 * Get all students and their quiz scores (teacher only)
 */
export async function getAllStudentsData() {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('Must be logged in');
        }

        // Check if user is teacher
        if (!await isTeacher(user.uid)) {
            throw new Error('Unauthorized: Teacher access only');
        }

        // Get all users with role 'student'
        const usersRef = collection(db, 'users');
        const studentsQuery = query(usersRef, where('role', '==', 'student'));
        const studentsSnapshot = await getDocs(studentsQuery);

        const studentsData = [];

        for (const studentDoc of studentsSnapshot.docs) {
            const studentData = studentDoc.data();

            // Get quiz scores for this student
            const scoresRef = collection(db, 'users', studentDoc.id, 'quizScores');
            const scoresSnapshot = await getDocs(scoresRef);

            const quizScores = [];
            scoresSnapshot.forEach((scoreDoc) => {
                quizScores.push({ id: scoreDoc.id, ...scoreDoc.data() });
            });

            studentsData.push({
                uid: studentDoc.id,
                profile: studentData,
                quizScores: quizScores
            });
        }

        return { success: true, students: studentsData };
    } catch (error) {
        console.error('Error fetching students data:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Export students data to CSV
 */
export function exportToCSV(studentsData) {
    // Create CSV header
    let csv = 'Student Name,Email,Total Quizzes,Average Score,Quiz ID,Score,Percentage,Attempts,Last Completed\n';

    // Add student rows
    studentsData.forEach(student => {
        const name = student.profile.displayName || 'N/A';
        const email = student.profile.email;
        const totalQuizzes = student.profile.totalQuizzesTaken || 0;
        const avgScore = student.profile.averageScore || 0;

        if (student.quizScores.length === 0) {
            csv += `"${name}","${email}",${totalQuizzes},${avgScore}%,No quizzes taken,,,\n`;
        } else {
            student.quizScores.forEach((quiz, index) => {
                const completedDate = quiz.completedAt ?
                    quiz.completedAt.toDate().toLocaleDateString() : 'N/A';

                if (index === 0) {
                    csv += `"${name}","${email}",${totalQuizzes},${avgScore}%,`;
                } else {
                    csv += `,,,,`;
                }

                csv += `"${quiz.quizId}",${quiz.score}/${quiz.totalQuestions},${quiz.percentage}%,${quiz.attempts},"${completedDate}"\n`;
            });
        }
    });

    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student-quiz-scores-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// ============================================================================
// ANALYTICS FUNCTIONS
// ============================================================================

/**
 * Track page view
 */
export function trackPageView(pageName) {
    logEvent(analytics, 'page_view', {
        page_title: pageName,
        page_location: window.location.href
    });
}

/**
 * Track lesson view
 */
export function trackLessonView(lessonId) {
    const user = auth.currentUser;
    logEvent(analytics, 'lesson_viewed', {
        lesson_id: lessonId,
        user_id: user ? user.uid : 'anonymous'
    });
}

/**
 * Track game played
 */
export function trackGamePlayed(gameId) {
    const user = auth.currentUser;
    logEvent(analytics, 'game_played', {
        game_id: gameId,
        user_id: user ? user.uid : 'anonymous'
    });
}

/**
 * Track visualizer used
 */
export function trackVisualizerUsed(visualizerId) {
    const user = auth.currentUser;
    logEvent(analytics, 'visualizer_used', {
        visualizer_id: visualizerId,
        user_id: user ? user.uid : 'anonymous'
    });
}
