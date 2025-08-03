import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock dependencies
const mockNavigate = jest.fn();
let mockAuthState = {
  isAuthenticated: true,
  isAdmin: false,
  loading: false
};

// Mock Navigate component
function Navigate({ to }) {
  mockNavigate(to);
  return <div data-testid="navigate">Redirecting to {to}</div>;
}

// Mock Outlet component (represents the protected content)
function Outlet() {
  return <div data-testid="protected-content">Protected Content</div>;
}

// Mock the ProtectedRoute component
function ProtectedRoute({ requireAdmin = false }) {
  const { isAuthenticated, isAdmin, loading } = mockAuthState;
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" />;
  }
  
  return <Outlet />;
}

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    // Reset mocks and auth state
    mockNavigate.mockClear();
    mockAuthState = {
      isAuthenticated: true,
      isAdmin: false,
      loading: false
    };
  });

  test('renders protected content when user is authenticated', () => {
    render(<ProtectedRoute />);
    
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('redirects to login when user is not authenticated', () => {
    mockAuthState.isAuthenticated = false;
    
    render(<ProtectedRoute />);
    
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByTestId('navigate')).toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('shows loading state when auth is loading', () => {
    mockAuthState.loading = true;
    
    render(<ProtectedRoute />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('allows access to admin route when user is admin', () => {
    mockAuthState.isAdmin = true;
    
    render(<ProtectedRoute requireAdmin={true} />);
    
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('redirects to home when non-admin tries to access admin route', () => {
    mockAuthState.isAdmin = false;
    
    render(<ProtectedRoute requireAdmin={true} />);
    
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByTestId('navigate')).toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});