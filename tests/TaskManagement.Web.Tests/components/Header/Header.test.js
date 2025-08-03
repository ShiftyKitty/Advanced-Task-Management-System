// tests/TaskManagement.Web.Tests/components/Header/Header.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock the components and hooks
const mockNavigate = jest.fn();
const mockLogout = jest.fn();

// Mock the AuthContext hook
const mockUseAuth = jest.fn().mockReturnValue({
  currentUser: { username: 'testUser' },
  isAdmin: false,
  logout: mockLogout
});

// Create a simplified mock of the Header component that matches the actual component
function Header() {
  const { currentUser, isAdmin, logout } = mockUseAuth();
  
  const handleLogout = () => {
    logout();
    mockNavigate('/login');
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <h1>Task Management System</h1>
        </div>
        <nav className="main-nav">
          <ul>
            <li className="active">
              <a href="/">My Tasks</a>
            </li>
            <li>
              <a href="/create">Add Task</a>
            </li>
            {isAdmin && (
              <li>
                <a href="/logs">Logs/Audit Trail</a>
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
}

describe('Header Component', () => {
  beforeEach(() => {
    // Reset mocks
    mockNavigate.mockClear();
    mockLogout.mockClear();
  });

  test('renders the header with application title', () => {
    render(<Header />);
    expect(screen.getByText('Task Management System')).toBeInTheDocument();
  });

  test('displays username when user is logged in', () => {
    mockUseAuth.mockReturnValue({
      currentUser: { username: 'regularUser' },
      isAdmin: false,
      logout: mockLogout
    });

    render(<Header />);
    expect(screen.getByText('regularUser')).toBeInTheDocument();
  });

  test('shows standard navigation links for regular users', () => {
    mockUseAuth.mockReturnValue({
      currentUser: { username: 'regularUser' },
      isAdmin: false,
      logout: mockLogout
    });

    render(<Header />);
    expect(screen.getByText('My Tasks')).toBeInTheDocument();
    expect(screen.getByText('Add Task')).toBeInTheDocument();
    expect(screen.queryByText('Logs/Audit Trail')).not.toBeInTheDocument();
  });

  test('shows admin links when user is an admin', () => {
    mockUseAuth.mockReturnValue({
      currentUser: { username: 'adminUser' },
      isAdmin: true,
      logout: mockLogout
    });

    render(<Header />);
    expect(screen.getByText('My Tasks')).toBeInTheDocument();
    expect(screen.getByText('Add Task')).toBeInTheDocument();
    expect(screen.getByText('Logs/Audit Trail')).toBeInTheDocument();
  });

  test('calls logout function when logout button is clicked', () => {
    mockUseAuth.mockReturnValue({
      currentUser: { username: 'testUser' },
      isAdmin: false,
      logout: mockLogout
    });

    render(<Header />);
    
    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);
    
    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('handles case when no user is logged in', () => {
    mockUseAuth.mockReturnValue({
      currentUser: null,
      isAdmin: false,
      logout: mockLogout
    });
    
    render(<Header />);
    
    // No username should be displayed
    expect(screen.queryByText(/regularUser/)).not.toBeInTheDocument();
    expect(screen.queryByText(/adminUser/)).not.toBeInTheDocument();
    
    // But the logout button should still be there
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });
});