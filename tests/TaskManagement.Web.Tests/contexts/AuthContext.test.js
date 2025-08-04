import React from 'react';
import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { AuthProvider, useAuth } from '../../../src/TaskManagement.Web/src/contexts/AuthContext.jsx';

// Mock the authService
jest.mock('../../../src/TaskManagement.Web/src/services/authService.js', () => ({
  authService: {
    getCurrentUser: jest.fn(),
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn()
  }
}));
import { authService } from '../../../src/TaskManagement.Web/src/services/authService.js';

// Dummy consumer for testing context
function AuthConsumer() {
  const ctx = useAuth();
  return (
    <div>
      <span data-testid="user">{ctx.currentUser ? ctx.currentUser.username : ''}</span>
      <span data-testid="admin">{ctx.isAdmin ? 'yes' : 'no'}</span>
      <span data-testid="auth">{ctx.isAuthenticated ? 'yes' : 'no'}</span>
      <span data-testid="loading">{ctx.loading ? 'yes' : 'no'}</span>
      <button onClick={() => ctx.login('foo', 'pw')}>login</button>
      <button onClick={() => ctx.register('bar', 'bar@email.com', 'pw')}>register</button>
      <button onClick={ctx.logout}>logout</button>
    </div>
  );
}

describe('AuthProvider + useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with no user and loading then not loading', async () => {
    authService.getCurrentUser.mockReturnValue(null);

    await act(async () => {
      render(<AuthProvider><AuthConsumer /></AuthProvider>);
    });

    expect(screen.getByTestId('loading').textContent).toBe('no');
    expect(screen.getByTestId('user').textContent).toBe('');
    expect(screen.getByTestId('auth').textContent).toBe('no');
    expect(screen.getByTestId('admin').textContent).toBe('no');
  });

  it('initializes with existing user', async () => {
    authService.getCurrentUser.mockReturnValue({ username: 'existing', role: 'Admin' });

    await act(async () => {
      render(<AuthProvider><AuthConsumer /></AuthProvider>);
    });

    expect(screen.getByTestId('loading').textContent).toBe('no');
    expect(screen.getByTestId('user').textContent).toBe('existing');
    expect(screen.getByTestId('admin').textContent).toBe('yes');
    expect(screen.getByTestId('auth').textContent).toBe('yes');
  });

  it('login updates context with user', async () => {
    authService.getCurrentUser.mockReturnValue(null);
    authService.login.mockResolvedValue({ username: 'bob', role: 'User' });

    render(<AuthProvider><AuthConsumer /></AuthProvider>);

    await act(async () => {
      screen.getByText('login').click();
    });

    expect(authService.login).toHaveBeenCalledWith('foo', 'pw');
    expect(screen.getByTestId('user').textContent).toBe('bob');
    expect(screen.getByTestId('auth').textContent).toBe('yes');
    expect(screen.getByTestId('admin').textContent).toBe('no');
  });

  it('register updates context with user', async () => {
    authService.getCurrentUser.mockReturnValue(null);
    authService.register.mockResolvedValue({ username: 'bar', role: 'Admin' });

    render(<AuthProvider><AuthConsumer /></AuthProvider>);

    await act(async () => {
      screen.getByText('register').click();
    });

    expect(authService.register).toHaveBeenCalledWith('bar', 'bar@email.com', 'pw');
    expect(screen.getByTestId('user').textContent).toBe('bar');
    expect(screen.getByTestId('admin').textContent).toBe('yes');
    expect(screen.getByTestId('auth').textContent).toBe('yes');
  });

  it('logout resets context user to null', async () => {
    authService.getCurrentUser.mockReturnValue({ username: 'willlogout', role: 'User' });

    await act(async () => {
      render(<AuthProvider><AuthConsumer /></AuthProvider>);
    });

    await act(async () => {
      screen.getByText('logout').click();
    });

    expect(authService.logout).toHaveBeenCalled();
    expect(screen.getByTestId('user').textContent).toBe('');
    expect(screen.getByTestId('auth').textContent).toBe('no');
    expect(screen.getByTestId('admin').textContent).toBe('no');
  });
});