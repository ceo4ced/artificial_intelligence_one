/**
 * Unit tests for auth-guard.js
 * Tests role-based access control and permission system
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('../auth/auth-utils.js', () => ({
  getCurrentUser: vi.fn().mockResolvedValue(null),
}));

import { ROLES, PERMISSIONS, hasPermission, getRoleDisplayName, getNextRole, canUpgrade } from '../auth/auth-guard.js';

describe('Auth Guard - Role System', () => {

  describe('ROLES constant', () => {
    it('should define all role types', () => {
      expect(ROLES.GUEST).toBe('guest');
      expect(ROLES.STUDENT).toBe('student');
      expect(ROLES.TEACHER).toBe('teacher');
    });
  });

  describe('PERMISSIONS constant', () => {
    it('should define VIEW_LESSONS permission for all roles', () => {
      expect(PERMISSIONS.VIEW_LESSONS).toEqual(['guest', 'student', 'teacher']);
    });

    it('should define USE_VISUALIZERS permission for students and teachers only', () => {
      expect(PERMISSIONS.USE_VISUALIZERS).toEqual(['student', 'teacher']);
      expect(PERMISSIONS.USE_VISUALIZERS).not.toContain('guest');
    });

    it('should define PLAY_GAMES permission for students and teachers only', () => {
      expect(PERMISSIONS.PLAY_GAMES).toEqual(['student', 'teacher']);
    });

    it('should define TAKE_QUIZZES permission for students and teachers only', () => {
      expect(PERMISSIONS.TAKE_QUIZZES).toEqual(['student', 'teacher']);
    });

    it('should define teacher-only permissions', () => {
      expect(PERMISSIONS.VIEW_ALL_STUDENTS).toEqual(['teacher']);
      expect(PERMISSIONS.EXPORT_DATA).toEqual(['teacher']);
      expect(PERMISSIONS.MANAGE_USERS).toEqual(['teacher']);
      expect(PERMISSIONS.DELETE_ACCOUNTS).toEqual(['teacher']);
    });
  });

  describe('hasPermission()', () => {
    it('should allow guests to view lessons', () => {
      expect(hasPermission('guest', 'VIEW_LESSONS')).toBe(true);
    });

    it('should NOT allow guests to use visualizers', () => {
      expect(hasPermission('guest', 'USE_VISUALIZERS')).toBe(false);
    });

    it('should NOT allow guests to play games', () => {
      expect(hasPermission('guest', 'PLAY_GAMES')).toBe(false);
    });

    it('should NOT allow guests to take quizzes', () => {
      expect(hasPermission('guest', 'TAKE_QUIZZES')).toBe(false);
    });

    it('should allow students to view lessons', () => {
      expect(hasPermission('student', 'VIEW_LESSONS')).toBe(true);
    });

    it('should allow students to use visualizers', () => {
      expect(hasPermission('student', 'USE_VISUALIZERS')).toBe(true);
    });

    it('should allow students to play games', () => {
      expect(hasPermission('student', 'PLAY_GAMES')).toBe(true);
    });

    it('should allow students to take quizzes', () => {
      expect(hasPermission('student', 'TAKE_QUIZZES')).toBe(true);
    });

    it('should NOT allow students to view all students', () => {
      expect(hasPermission('student', 'VIEW_ALL_STUDENTS')).toBe(false);
    });

    it('should allow teachers all student permissions', () => {
      expect(hasPermission('teacher', 'VIEW_LESSONS')).toBe(true);
      expect(hasPermission('teacher', 'USE_VISUALIZERS')).toBe(true);
      expect(hasPermission('teacher', 'PLAY_GAMES')).toBe(true);
      expect(hasPermission('teacher', 'TAKE_QUIZZES')).toBe(true);
    });

    it('should allow teachers admin permissions', () => {
      expect(hasPermission('teacher', 'VIEW_ALL_STUDENTS')).toBe(true);
      expect(hasPermission('teacher', 'EXPORT_DATA')).toBe(true);
      expect(hasPermission('teacher', 'MANAGE_USERS')).toBe(true);
      expect(hasPermission('teacher', 'DELETE_ACCOUNTS')).toBe(true);
    });

    it('should return false for unknown permissions', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
      expect(hasPermission('student', 'UNKNOWN_PERMISSION')).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown permission'));
      consoleSpy.mockRestore();
    });
  });

  describe('getRoleDisplayName()', () => {
    it('should return display name for guest', () => {
      expect(getRoleDisplayName('guest')).toBe('Guest');
    });

    it('should return display name for student', () => {
      expect(getRoleDisplayName('student')).toBe('Student');
    });

    it('should return display name for teacher', () => {
      expect(getRoleDisplayName('teacher')).toBe('Teacher');
    });

    it('should return Unknown for invalid role', () => {
      expect(getRoleDisplayName('invalid')).toBe('Unknown');
    });
  });

  describe('getNextRole()', () => {
    it('should return student for guest', () => {
      expect(getNextRole('guest')).toBe('student');
    });

    it('should return teacher for student', () => {
      expect(getNextRole('student')).toBe('teacher');
    });

    it('should return null for teacher (highest role)', () => {
      expect(getNextRole('teacher')).toBe(null);
    });
  });

  describe('canUpgrade()', () => {
    it('should return true for guest', () => {
      expect(canUpgrade('guest')).toBe(true);
    });

    it('should return false for student', () => {
      expect(canUpgrade('student')).toBe(false);
    });

    it('should return false for teacher', () => {
      expect(canUpgrade('teacher')).toBe(false);
    });
  });
});

describe('Auth Guard - Permission Hierarchy', () => {
  it('should maintain proper role hierarchy', () => {
    // Guest < Student < Teacher

    // Guests have least permissions
    const guestPerms = Object.keys(PERMISSIONS).filter(perm =>
      hasPermission('guest', perm)
    );

    // Students have more permissions than guests
    const studentPerms = Object.keys(PERMISSIONS).filter(perm =>
      hasPermission('student', perm)
    );

    // Teachers have most permissions
    const teacherPerms = Object.keys(PERMISSIONS).filter(perm =>
      hasPermission('teacher', perm)
    );

    expect(studentPerms.length).toBeGreaterThan(guestPerms.length);
    expect(teacherPerms.length).toBeGreaterThan(studentPerms.length);
  });

  it('should grant cumulative permissions up the hierarchy', () => {
    // Everything a guest can do, a student can do
    Object.keys(PERMISSIONS).forEach(perm => {
      if (hasPermission('guest', perm)) {
        expect(hasPermission('student', perm)).toBe(true);
      }
    });

    // Everything a student can do, a teacher can do
    Object.keys(PERMISSIONS).forEach(perm => {
      if (hasPermission('student', perm)) {
        expect(hasPermission('teacher', perm)).toBe(true);
      }
    });
  });
});

describe('Auth Guard - Security Tests', () => {
  it('should never allow guests to modify data', () => {
    expect(hasPermission('guest', 'SAVE_PROGRESS')).toBe(false);
  });

  it('should never allow students to delete accounts', () => {
    expect(hasPermission('student', 'DELETE_ACCOUNTS')).toBe(false);
  });

  it('should never allow students to view all student data', () => {
    expect(hasPermission('student', 'VIEW_ALL_STUDENTS')).toBe(false);
  });

  it('should never allow students to export data', () => {
    expect(hasPermission('student', 'EXPORT_DATA')).toBe(false);
  });
});
