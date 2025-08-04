import { useState, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login, currentUser } = useAuth();
  
  // Redirect already authenticated users
  useEffect(() => {
    if (currentUser) {
      navigate('/', { replace: true });
    }
  }, [currentUser, navigate]);
  
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    // Field validation
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    
    if (!password) {
      setError('Password is required');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      await login(username, password);
      navigate('/', { replace: true });
    } catch (err) {
      // Map error codes to user-friendly messages
      if (err.code === 'auth/invalid-credential') {
        setError('Invalid username or password');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later.');
      } else {
        setError(`Authentication failed: ${err.message || 'Please check your credentials'}`);
      }
      
      // Return focus to username field after error
      document.getElementById('username')?.focus();
    } finally {
      setLoading(false);
    }
  }, [username, password, login, navigate]);
  
  return (
    <div className="login-container" data-testid="login-component">
      <h1 className="screen-title">Task Management System</h1>
      
      <div className="login-form">
        <h2>Login to your account</h2>
        
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
              placeholder="Enter your username"
              autoComplete="username"
              disabled={loading}
              required
              aria-required="true"
              data-testid="username-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={loading}
              required
              aria-required="true"
              data-testid="password-input"
            />
          </div>
          
          <div className="form-actions">
            <button 
              type="submit" 
              className="btn-login" 
              disabled={loading}
              aria-busy={loading}
              data-testid="login-button"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
        
        <div className="auth-links">
          <p>
            Don't have an account? <Link to="/signup" data-testid="signup-link">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;