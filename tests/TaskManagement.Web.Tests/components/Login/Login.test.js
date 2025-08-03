import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock dependencies
const mockNavigate = jest.fn();
const mockLogin = jest.fn();

// Mock Login component
function Login() {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      await mockLogin(username, password);
      mockNavigate('/');
    } catch (err) {
      setError('Failed to login: ' + (err.message || 'Please check your credentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h1 className="screen-title">Task Management System</h1>
      
      <div className="login-form">
        <h2>Login to your account</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
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
            />
          </div>
          
          <div className="form-actions">
            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
        
        <div className="auth-links">
          <p>Don't have an account? <a href="/signup">Sign up</a></p>
        </div>
      </div>
    </div>
  );
}

describe('Login Component', () => {
  beforeEach(() => {
    // Reset mocks
    mockNavigate.mockClear();
    mockLogin.mockClear();
    // Reset mockLogin to resolve successfully by default
    mockLogin.mockResolvedValue({});
  });

  test('renders login form with required fields', () => {
    render(<Login />);
    
    expect(screen.getByText('Task Management System')).toBeInTheDocument();
    expect(screen.getByText('Login to your account')).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('shows validation error when submitting without username or password', () => {
    render(<Login />);
    
    // Submit form without entering any data
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    expect(screen.getByText('Please enter both username and password')).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  test('shows validation error when submitting with username but no password', () => {
    render(<Login />);
    
    // Enter only username
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    expect(screen.getByText('Please enter both username and password')).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  test('shows validation error when submitting with password but no username', () => {
    render(<Login />);
    
    // Enter only password
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    expect(screen.getByText('Please enter both username and password')).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  test('calls login function with correct data when form is submitted', async () => {
    render(<Login />);
    
    // Fill in form
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    // Check login was called with correct data
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('displays error message when login fails', async () => {
    // Mock login to reject with an error
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));
    
    render(<Login />);
    
    // Fill in form
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpassword' } });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    // Check error is displayed
    await waitFor(() => {
      expect(screen.getByText(/Failed to login: Invalid credentials/i)).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  test('disables login button while logging in', async () => {
    // Create a promise that we can resolve manually to control the login timing
    let resolveLogin;
    const loginPromise = new Promise(resolve => {
      resolveLogin = resolve;
    });
    mockLogin.mockReturnValueOnce(loginPromise);
    
    render(<Login />);
    
    // Fill in form
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    // Button should be disabled and show loading text
    expect(screen.getByRole('button', { name: /logging in/i })).toBeDisabled();
    
    // Resolve login promise
    resolveLogin({});
    
    // Button should be enabled again
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /login/i })).not.toBeDisabled();
    });
  });
  
  test('includes sign up link that navigates to signup page', () => {
    render(<Login />);
    
    const signupLink = screen.getByText('Sign up');
    expect(signupLink).toBeInTheDocument();
    expect(signupLink.closest('a')).toHaveAttribute('href', '/signup');
  });
});