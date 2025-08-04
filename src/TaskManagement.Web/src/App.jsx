import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, memo } from 'react';
import './App.css';
import Header from './components/Header/Header';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Lazy load components for code splitting
const TaskList = lazy(() => import('./components/TaskList/TaskList'));
const TaskForm = lazy(() => import('./components/TaskForm/TaskForm'));
const TaskDetail = lazy(() => import('./components/TaskDetail/TaskDetail'));
const Login = lazy(() => import('./components/Login/Login'));
const Signup = lazy(() => import('./components/Signup/Signup'));
const LogsView = lazy(() => import('./components/LogsView/LogsView'));

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

// Use memo to prevent unnecessary re-renders
const AppContent = memo(() => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="loading-app">Loading application...</div>;
  }
  
  return (
    <div className="app">
      {isAuthenticated && <Header />}
      <main>
        <Suspense fallback={<div className="loading-app">Loading page...</div>}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={
              isAuthenticated ? <Navigate to="/" replace /> : <Login />
            } />
            <Route path="/signup" element={
              isAuthenticated ? <Navigate to="/" replace /> : <Signup />
            } />
            
            {/* Protected routes - require authentication */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<TaskList />} />
              <Route path="/create" element={<TaskForm />} />
              <Route path="/tasks/:id" element={<TaskDetail />} />
              <Route path="/tasks/:id/edit" element={<TaskDetail isEditing={true} />} />
            </Route>
            
            {/* Admin-only routes */}
            <Route element={<ProtectedRoute requireAdmin={true} />}>
              <Route path="/logs" element={<LogsView />} />
            </Route>
            
            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
});

AppContent.displayName = 'AppContent';

export default App;