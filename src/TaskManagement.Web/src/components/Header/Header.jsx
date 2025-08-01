import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const location = useLocation();
  
  // Check which path is active for navigation highlighting
  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <h1>Advanced Task Management</h1>
        </div>
        <nav className="main-nav">
          <ul>
            <li className={isActive('/')}>
              <Link to="/">My Tasks</Link>
            </li>
            <li className={isActive('/create')}>
              <Link to="/create">Add Task</Link>
            </li>
            {/* Conditionally render admin links - you can add logic later */}
            <li className={isActive('/logs')}>
              <Link to="/logs">Logs/Audit Trail</Link>
            </li>
          </ul>
        </nav>
        <div className="user-actions">
          <Link to="/login" className="login-btn">Login</Link>
          <Link to="/signup" className="signup-btn">Sign Up</Link>
        </div>
      </div>
    </header>
  );
};

export default Header;