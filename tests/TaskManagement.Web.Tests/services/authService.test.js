import { authService } from '../../../src/TaskManagement.Web/src/services/authService.js';

describe('authService', () => {
  // Mock setup and teardown
  beforeEach(() => {
    global.fetch = jest.fn();
    localStorage.clear();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('login', () => {
    it('logs in successfully and stores user', async () => {
      // Arrange
      const fakeUser = { username: 'bob', token: 'abc', role: 'User' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => fakeUser
      });

      // Act
      const result = await authService.login('bob', 'pw');
      
      // Assert
      expect(result).toEqual(fakeUser);
      expect(localStorage.getItem('user')).toBe(JSON.stringify(fakeUser));
      expect(fetch).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'bob', password: 'pw' })
        })
      );
    });

    it('throws on login failure and does not store user', async () => {
      // Arrange
      jest.spyOn(console, 'error').mockImplementation(() => {});
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid credentials' })
      });

      // Act & Assert
      await expect(authService.login('fail', 'bad')).rejects.toThrow('Invalid credentials');
      expect(localStorage.getItem('user')).toBe(null);
      
      // Cleanup
      console.error.mockRestore();
    });
  });

  describe('register', () => {
    it('registers and stores user', async () => {
      // Arrange
      const fakeUser = { username: 'jane', token: 'abc', role: 'User' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => fakeUser
      });

      // Act
      const result = await authService.register('jane', 'jane@email.com', 'pw');
      
      // Assert
      expect(result).toEqual(fakeUser);
      expect(localStorage.getItem('user')).toBe(JSON.stringify(fakeUser));
      expect(fetch).toHaveBeenCalledWith(
        '/api/auth/register',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'jane', email: 'jane@email.com', password: 'pw' })
        })
      );
    });

    it('throws on registration failure and does not store user', async () => {
      // Arrange
      jest.spyOn(console, 'error').mockImplementation(() => {});
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Registration failed' })
      });

      // Act & Assert
      await expect(authService.register('bad', 'x', 'x')).rejects.toThrow('Registration failed');
      expect(localStorage.getItem('user')).toBe(null);
      
      // Cleanup
      console.error.mockRestore();
    });
  });

  describe('logout', () => {
    it('removes user from localStorage', () => {
      // Arrange
      localStorage.setItem('user', JSON.stringify({ test: 1 }));
      
      // Act
      authService.logout();
      
      // Assert
      expect(localStorage.getItem('user')).toBe(null);
    });
  });

  describe('getCurrentUser', () => {
    it('returns current user if present', () => {
      // Arrange
      const user = { a: 1 };
      localStorage.setItem('user', JSON.stringify(user));
      
      // Act & Assert
      expect(authService.getCurrentUser()).toEqual(user);
    });

    it('returns null if no user in storage', () => {
      expect(authService.getCurrentUser()).toBe(null);
    });

    it('returns null if bad JSON', () => {
      // Arrange - corrupt data scenario
      localStorage.setItem('user', '{bad json}');
      
      // Act & Assert
      expect(authService.getCurrentUser()).toBe(null);
    });
  });

  describe('isAuthenticated', () => {
    it('returns true if user present', () => {
      // Arrange
      localStorage.setItem('user', JSON.stringify({ x: 2 }));
      
      // Act & Assert
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('returns false if no user', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('returns true if user role is Admin', () => {
      // Arrange
      localStorage.setItem('user', JSON.stringify({ role: 'Admin' }));
      
      // Act & Assert
      expect(authService.isAdmin()).toBe(true);
    });

    it('returns false if user not admin or missing', () => {
      // Non-admin user
      localStorage.setItem('user', JSON.stringify({ role: 'User' }));
      expect(authService.isAdmin()).toBe(false);
      
      // Missing user
      localStorage.removeItem('user');
      expect(authService.isAdmin()).toBe(false);
    });
  });
});