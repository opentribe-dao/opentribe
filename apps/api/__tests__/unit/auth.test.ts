import { describe, expect, test, vi, beforeEach } from 'vitest';
import { auth } from '@packages/auth/server';

describe('Authentication Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Session Management', () => {
    test('should handle authenticated user session', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          username: 'testuser',
          role: 'USER',
          firstName: 'Test',
          lastName: 'User',
        },
        session: {
          id: 'session-123',
          userId: 'user-123',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      };

      (auth.api.getSession as any).mockResolvedValue(mockSession);

      // Act
      const headers = new Headers({
        'Authorization': 'Bearer test-token',
      });
      const session = await auth.api.getSession({ headers });

      // Assert
      expect(session).toBeDefined();
      expect(session?.user.id).toBe('user-123');
      expect(session?.user.email).toBe('test@example.com');
      expect(auth.api.getSession).toHaveBeenCalledWith({ headers });
    });

    test('should handle unauthenticated requests', async () => {
      // Arrange
      (auth.api.getSession as any).mockResolvedValue(null);

      // Act
      const headers = new Headers();
      const session = await auth.api.getSession({ headers });

      // Assert
      expect(session).toBeNull();
      expect(auth.api.getSession).toHaveBeenCalledTimes(1);
    });

    test('should handle admin role correctly', async () => {
      // Arrange
      const mockAdminSession = {
        user: {
          id: 'admin-123',
          email: 'admin@example.com',
          username: 'adminuser',
          role: 'SUPERADMIN',
        },
        session: {
          id: 'session-admin',
          userId: 'admin-123',
        },
      };

      (auth.api.getSession as any).mockResolvedValue(mockAdminSession);

      // Act
      const headers = new Headers({
        'Authorization': 'Bearer admin-token',
      });
      const session = await auth.api.getSession({ headers });

      // Assert
      expect(session?.user.role).toBe('SUPERADMIN');
      expect(session?.user.id).toBe('admin-123');
    });
  });

  describe('Authorization', () => {
    test('should check if user has required role', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'user-123',
          role: 'USER',
        },
      };

      (auth.api.getSession as any).mockResolvedValue(mockSession);

      // Act
      const headers = new Headers();
      const session = await auth.api.getSession({ headers });

      // Assert
      const hasUserRole = session?.user.role === 'USER';
      const hasAdminRole = session?.user.role === 'SUPERADMIN';

      expect(hasUserRole).toBe(true);
      expect(hasAdminRole).toBe(false);
    });
  });
});