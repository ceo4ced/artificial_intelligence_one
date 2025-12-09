// Test setup file
// Runs before all tests

import { beforeAll, afterEach, afterAll, vi } from 'vitest';

// Mock Firebase modules
vi.mock('./auth/firebase-config.js', () => ({
  auth: {
    currentUser: null,
  },
  db: {},
  analytics: {},
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
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

global.sessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock window.location
delete window.location;
window.location = {
  href: '',
  pathname: '/',
  reload: vi.fn(),
};
