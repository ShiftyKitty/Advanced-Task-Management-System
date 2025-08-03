const API_URL = 'http://localhost:5271/api/auth';

export const authService = {
  /**
   * Authenticates user and stores session data
   */
  async login(username, password) {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const errorData = await response.json();
      const error = new Error(errorData.message || 'Login failed');
      error.status = response.status;
      throw error;
    }

    const user = await response.json();
    
    // Store user session
    localStorage.setItem('user', JSON.stringify(user));
    
    return user;
  },

  /**
   * Creates new user account and authenticates
   */
  async register(username, email, password) {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    if (!response.ok) {
      const errorData = await response.json();
      const error = new Error(errorData.message || 'Registration failed');
      error.status = response.status;
      throw error;
    }

    const user = await response.json();
    
    // Store user session
    localStorage.setItem('user', JSON.stringify(user));
    
    return user;
  },

  /**
   * Ends user session
   */
  logout() {
    localStorage.removeItem('user');
  },

  /**
   * Gets current authenticated user
   * @returns {Object|null} User data or null if not authenticated
   */
  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('User data parsing failed:', error);
      localStorage.removeItem('user'); // Clear corrupt data
      return null;
    }
  },

  /**
   * Checks if user is authenticated
   * @returns {boolean} Authentication status
   */
  isAuthenticated() {
    return Boolean(this.getCurrentUser()?.token);
  },

  /**
   * Checks if user has admin privileges
   * @returns {boolean} Admin status
   */
  isAdmin() {
    const user = this.getCurrentUser();
    return Boolean(user?.role === 'Admin');
  }
};

/*
Design/Coding Choices:

1. Authentication Flow:
   - Consistent error handling with status codes
   - Safely handles token storage and retrieval
   - Enforces proper authentication state checking

2. Security:
   - Uses Boolean conversions for consistent truthiness checks
   - Clears corrupt data to prevent authentication issues
   - Only checks properties that actually matter for auth state

3. Error Management:
   - Enhanced error objects with HTTP status
   - Consistent error handling pattern
   - Safely handles JSON parsing failures

4. Code Organization:
   - Consistent method syntax across service
   - Minimal comments focused on "why" not "what"
   - Uses method shorthand for cleaner object definition
*/