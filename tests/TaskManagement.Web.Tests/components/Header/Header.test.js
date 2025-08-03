import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from '../../../../src/TaskManagement.Web/src/components/Header/Header';
import { AuthContext } from '../../../../src/TaskManagement.Web/src/contexts/AuthContext';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({ pathname: '/' }),
  useNavigate: () => jest.fn()
}));

// Mock the useAuth hook
jest.mock('../../../../src/TaskManagement.Web/src/contexts/AuthContext', () => ({
  useAuth: jest.fn()
}));

describe('Header Component', () => {
  // Setup for different user scenarios
  const setupRegularUser = () => {
    // Mock implementation for a regular user
    require('../../../../src/TaskManagement.Web/src/contexts/AuthContext').useAuth.mockReturnValue({
      currentUser: { username: 'regularUser' },
      isAdmin: false,
      logout: jest.fn()
    });
  };

  const setupAdminUser = () => {
    // Mock implementation for an admin user
    require('../../../../src/TaskManagement.Web/src/contexts/AuthContext').useAuth.mockReturnValue({
      currentUser: { username: 'adminUser' },
      isAdmin: true,
      logout: jest.fn()
    });
  };

  const setupNoUser = () => {
    // Mock implementation for no user logged in
    require('../../../../src/TaskManagement.Web/src/contexts/AuthContext').useAuth.mockReturnValue({
      currentUser: null,
      isAdmin: false,
      logout: jest.fn()
    });
  };

  test('renders the header with application title', () => {
    setupRegularUser();
    
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    
    expect(screen.getByText('Task Management System')).toBeInTheDocument();
  });

  test('displays username when user is logged in', () => {
    setupRegularUser();
    
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    
    expect(screen.getByText('regularUser')).toBeInTheDocument();
  });

  test('shows standard navigation links for regular users', () => {
    setupRegularUser();
    
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    
    expect(screen.getByText('My Tasks')).toBeInTheDocument();
    expect(screen.getByText('Add Task')).toBeInTheDocument();
    expect(screen.queryByText('Logs/Audit Trail')).not.toBeInTheDocument();
  });

  test('shows admin links when user is an admin', () => {
    setupAdminUser();
    
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    
    expect(screen.getByText('My Tasks')).toBeInTheDocument();
    expect(screen.getByText('Add Task')).toBeInTheDocument();
    expect(screen.getByText('Logs/Audit Trail')).toBeInTheDocument();
  });

  test('calls logout function when logout button is clicked', () => {
    setupRegularUser();
    const mockLogout = require('../../../../src/TaskManagement.Web/src/contexts/AuthContext').useAuth().logout;
    
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    
    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);
    
    expect(mockLogout).toHaveBeenCalled();
  });

  test('applies active class to current route', () => {
    setupRegularUser();
    
    // Mock useLocation to return a specific path
    require('react-router-dom').useLocation.mockReturnValue({ pathname: '/create' });
    
    render(
      <MemoryRouter initialEntries={['/create']}>
        <Header />
      </MemoryRouter>
    );
    
    // Get all list items
    const listItems = screen.getAllByRole('listitem');
    
    // The "Add Task" link should have the active class
    const addTaskItem = listItems.find(item => item.textContent === 'Add Task');
    expect(addTaskItem).toHaveClass('active');
    
    // The "My Tasks" link should not have the active class
    const myTasksItem = listItems.find(item => item.textContent === 'My Tasks');
    expect(myTasksItem).not.toHaveClass('active');
  });

  test('handles case when no user is logged in', () => {
    setupNoUser();
    
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    
    // No username should be displayed
    expect(screen.queryByText(/regularUser/)).not.toBeInTheDocument();
    expect(screen.queryByText(/adminUser/)).not.toBeInTheDocument();
    
    // But the logout button should still be there
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });
});