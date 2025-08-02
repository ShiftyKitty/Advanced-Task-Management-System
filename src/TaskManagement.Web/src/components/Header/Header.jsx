// src/components/Header/Header.jsx
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Header.css';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, isAdmin, logout } = useAuth();
  
  // Check which path is active for navigation highlighting
  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <h1>Task Management System</h1>
        </div>
        <nav className="main-nav">
          <ul>
            <li className={isActive('/')}>
              <Link to="/">My Tasks</Link>
            </li>
            <li className={isActive('/create')}>
              <Link to="/create">Add Task</Link>
            </li>
            {isAdmin && (
              <li className={isActive('/logs')}>
                <Link to="/logs">Logs/Audit Trail</Link>
              </li>
            )}
          </ul>
        </nav>
        <div className="user-actions">
          <span className="username">{currentUser?.username}</span>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </header>
  );
};

export default Header;