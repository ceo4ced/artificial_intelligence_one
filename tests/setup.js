// Test setup file
// Runs before all tests - Updated for tiered content system

import { beforeAll, afterEach, afterAll, vi } from 'vitest';

// Mock Firebase modules
vi.mock('../auth/firebase-config.js', () => ({
    auth: {
        currentUser: null,
        onAuthStateChanged: vi.fn((callback) => {
            callback(null);
            return vi.fn();
        }),
    },
    db: {},
    analytics: {},
}));

// Mock Firestore functions
vi.mock('https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js', () => ({
    doc: vi.fn(),
    setDoc: vi.fn(() => Promise.resolve()),
    getDoc: vi.fn(() => Promise.resolve({ exists: () => false, data: () => null })),
    getDocs: vi.fn(() => Promise.resolve({ empty: true, docs: [], forEach: vi.fn() })),
    updateDoc: vi.fn(() => Promise.resolve()),
    deleteDoc: vi.fn(() => Promise.resolve()),
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    Timestamp: {
        now: () => ({ toDate: () => new Date(), toMillis: () => Date.now() }),
        fromDate: (date) => ({ toDate: () => date }),
    },
    increment: vi.fn((n) => n),
    arrayUnion: vi.fn((...args) => args),
    arrayRemove: vi.fn((...args) => args),
    writeBatch: vi.fn(() => ({
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        commit: vi.fn(() => Promise.resolve()),
    })),
    addDoc: vi.fn(() => Promise.resolve({ id: 'mock-doc-id' })),
}));

// Mock Firebase Auth functions
vi.mock('https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js', () => ({
    createUserWithEmailAndPassword: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    signInWithPopup: vi.fn(),
    GoogleAuthProvider: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChanged: vi.fn(),
    updateProfile: vi.fn(),
}));

// Mock Firebase Analytics
vi.mock('https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js', () => ({
    logEvent: vi.fn(),
}));

// Setup global test utilities
beforeAll(() => {
    console.log('🧪 Test suite starting...');
});

afterEach(() => {
    vi.clearAllMocks();
});

afterAll(() => {
    console.log('✅ All tests completed');
});

// Mock browser APIs
global.localStorage = {
    store: {},
    getItem: vi.fn((key) => global.localStorage.store[key] || null),
    setItem: vi.fn((key, value) => { global.localStorage.store[key] = value; }),
    removeItem: vi.fn((key) => { delete global.localStorage.store[key]; }),
    clear: vi.fn(() => { global.localStorage.store = {}; }),
};

global.sessionStorage = {
    store: {},
    getItem: vi.fn((key) => global.sessionStorage.store[key] || null),
    setItem: vi.fn((key, value) => { global.sessionStorage.store[key] = value; }),
    removeItem: vi.fn((key) => { delete global.sessionStorage.store[key]; }),
    clear: vi.fn(() => { global.sessionStorage.store = {}; }),
};

// Mock window.location
delete window.location;
window.location = {
    href: '',
    pathname: '/',
    reload: vi.fn(),
    origin: 'http://localhost',
};

// Mock navigator
global.navigator = {
    userAgent: 'test-agent',
};

// Mock document.referrer
Object.defineProperty(document, 'referrer', {
    value: 'http://test-referrer.com',
    writable: true,
});

// Helper function to create mock user
export function createMockUser(overrides = {}) {
    return {
        uid: 'test-uid-123',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'guest',
        createdAt: { toDate: () => new Date() },
        totalQuizzesTaken: 0,
        averageScore: 0,
        ...overrides,
    };
}

// Helper function to create mock organization
export function createMockOrganization(overrides = {}) {
    return {
        id: 'org-123',
        type: 'school',
        name: 'Test School',
        parentId: null,
        parentPath: [],
        adminIds: ['admin-uid'],
        settings: {
            allowTeacherRegistration: true,
            requireApproval: true,
            autoApproveStudents: false,
        },
        stats: {
            totalUsers: 0,
            totalStudents: 0,
            totalTeachers: 0,
            totalClassrooms: 0,
        },
        createdAt: { toDate: () => new Date() },
        ...overrides,
    };
}

// Helper function to create mock subscription
export function createMockSubscription(overrides = {}) {
    return {
        id: 'sub-123',
        userId: 'test-uid-123',
        tier: 'free',
        type: 'individual',
        status: 'active',
        billingCycle: 'monthly',
        price: 0,
        startDate: { toDate: () => new Date() },
        endDate: null,
        seats: { total: 1, used: 1 },
        createdAt: { toDate: () => new Date() },
        ...overrides,
    };
}

// Helper function to create mock classroom
export function createMockClassroom(overrides = {}) {
    return {
        id: 'class-123',
        name: 'Test Classroom',
        code: 'ABC123',
        schoolId: 'school-123',
        teacherId: 'teacher-uid',
        coTeacherIds: [],
        studentIds: [],
        maxStudents: 30,
        isActive: true,
        createdAt: { toDate: () => new Date() },
        ...overrides,
    };
}
