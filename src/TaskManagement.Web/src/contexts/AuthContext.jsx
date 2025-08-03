import React, { createContext, useState, useEffect, useContext, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { authService } from '../services/authService';

// Create context with default shape to improve autocompletion
const AuthContext = createContext({
  currentUser: null,
  isAuthenticated: false,
  isAdmin: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  loading: true
});

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize authentication state on mount
  useEffect(() => {
    const initAuth = () => {
      try {
        const user = authService.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Authentication methods with proper error handling
  const login = useCallback(async (username, password) => {
    try {
      const user = await authService.login(username, password);
      setCurrentUser(user);
      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, []);

  const register = useCallback(async (username, email, password) => {
    try {
      const user = await authService.register(username, email, password);
      setCurrentUser(user);
      return user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setCurrentUser(null);
  }, []);

  // Memoize context value to prevent unnecessary renders
  const contextValue = useMemo(() => ({
    currentUser,
    isAuthenticated: Boolean(currentUser),
    isAdmin: Boolean(currentUser?.role === 'Admin'),
    login,
    register,
    logout,
    loading
  }), [currentUser, loading, login, logout, register]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

/*
Design/Coding Choices:

1. Performance Optimization:
   - Used useMemo to prevent unnecessary context rerenders
   - Memoized handler functions with useCallback
   - Added proper dependency arrays to hooks

2. Error Handling:
   - Added try/catch for initialization
   - Preserved error propagation for login/register failures
   - Added graceful degradation for auth state

3. Type Safety:
   - Added PropTypes for better component documentation
   - Defined context shape with default values
   - Used Boolean() for consistent type conversion

4. React Best Practices:
   - Separated context creation from provider implementation
   - Added descriptive error messages for hooks usage
   - Maintained clear separation between auth state and methods
*/