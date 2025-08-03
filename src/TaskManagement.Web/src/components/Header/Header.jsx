import { memo, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Header.css';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, isAdmin, logout } = useAuth();
  
  // Returns 'active' class when path matches current location
  const isActive = useCallback(
    (path) => location.pathname === path ? 'active' : '',
    [location.pathname]
  );
  
  // Handles logout with error handling for failed auth operations
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Silent failure - UX decision to not show logout errors to users
    }
  }, [logout, navigate]);

  return (
    <header className="header" role="banner">
      <div className="header-container">
        <div className="logo">
          <h1>Task Management System</h1>
        </div>
        
        <nav className="main-nav" aria-label="Main navigation">
          <ul>
            <li className={isActive('/')}>
              <Link to="/" data-testid="nav-tasks">My Tasks</Link>
            </li>
            <li className={isActive('/create')}>
              <Link to="/create" data-testid="nav-create">Add Task</Link>
            </li>
            {isAdmin && (
              <li className={isActive('/logs')}>
                <Link to="/logs" data-testid="nav-logs">Logs/Audit Trail</Link>
              </li>
            )}
          </ul>
        </nav>
        
        <div className="user-actions">
          <span className="username" aria-label="Current user">
            {currentUser?.username || 'Guest'}
          </span>
          <button 
            className="logout-btn" 
            onClick={handleLogout}
            aria-label="Log out"
            data-testid="logout-button"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default memo(Header);

/*
Design/Architecture Notes:

1. Performance Optimization:
   - Functions memoized with useCallback to prevent regeneration between renders
   - Component memoized with memo to prevent unnecessary re-renders

2. Accessibility:
   - Semantic HTML with proper ARIA roles and labels
   - Keyboard navigation support through native elements

3. Error Handling:
   - Silent failure on logout errors to avoid disrupting user experience
   - Logs errors for monitoring but doesn't display to user

4. Security Considerations:
   - Role-based access control via isAdmin conditional rendering
   - Authentication state managed through secure context
*/