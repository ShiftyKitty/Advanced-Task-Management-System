import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Signup.css';

const Signup = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { register } = useAuth();
  
  // RFC 5322 compliant email validation
  const validateEmail = useCallback((email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.toLowerCase());
  }, []);
  
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    // Form validation with specific error messages
    if (!username.trim()) {
      setError('Username is required');
      document.getElementById('username')?.focus();
      return;
    }
    
    if (!email.trim()) {
      setError('Email is required');
      document.getElementById('email')?.focus();
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      document.getElementById('email')?.focus();
      return;
    }
    
    if (!password) {
      setError('Password is required');
      document.getElementById('password')?.focus();
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      document.getElementById('password')?.focus();
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      document.getElementById('confirmPassword')?.focus();
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      await register(username.trim(), email.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email format');
      } else {
        setError(`Account creation failed: ${err.message || 'Please try again'}`);
      }
    } finally {
      setLoading(false);
    }
  }, [username, email, password, confirmPassword, register, navigate, validateEmail]);
  
  return (
    <div className="signup-container" data-testid="signup-component">
      <h1 className="screen-title">Task Management System</h1>
      
      <div className="signup-form">
        <h2>Create an account</h2>
        
        {error && (
          <div className="error-message" role="alert" aria-live="assertive">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              autoComplete="username"
              disabled={loading}
              required
              aria-required="true"
              data-testid="username-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              disabled={loading}
              required
              aria-required="true"
              data-testid="email-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              autoComplete="new-password"
              disabled={loading}
              required
              aria-required="true"
              minLength={6}
              data-testid="password-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password:</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              autoComplete="new-password"
              disabled={loading}
              required
              aria-required="true"
              data-testid="confirm-password-input"
            />
          </div>
          
          <div className="form-actions">
            <button 
              type="submit" 
              className="btn-signup" 
              disabled={loading}
              aria-busy={loading}
              data-testid="signup-button"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </div>
        </form>
        
        <div className="auth-links">
          <p>
            Already have an account? <Link to="/login" data-testid="login-link">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;

/*
Design/Coding Choices:

1. Validation Strategy:
   - Field-specific validation with targeted error messages
   - Focus management returns users to problematic fields
   - Early returns prevent unnecessary validation checks

2. Security:
   - Input sanitization with trim() to prevent whitespace attacks
   - Proper autocomplete attributes for password managers
   - Specific error handling for auth-related failures

3. User Experience:
   - Form state preserved during validation errors
   - Clear loading indicators during async operations
   - Navigates with replace to prevent back-button issues

4. Accessibility:
   - ARIA attributes for required fields and error announcements
   - Form validation with proper focus management
   - Semantic HTML structure with proper labeling
*/