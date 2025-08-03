import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ requireAdmin = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  
  // Show loading indicator while auth state initializes
  if (loading) {
    return <div>Loading...</div>;
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Redirect to home if admin access is required but user isn't admin
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return <Outlet />;
};

export default ProtectedRoute;

/*
Design/Coding Choices:

1. Security:
   - Two-tier authorization model (authenticated and admin roles)
   - Explicit redirects for unauthorized access attempts
   - Added replace flag to prevent navigation history issues

2. UX Considerations:
   - Loading state prevents flash of unauthorized content
   - Hierarchical access control (admins see everything, users see permitted routes)

3. Implementation:
   - Clean conditional logic with early returns for better readability
   - Leverages React Router's built-in navigation components
   - Simple boolean prop interface for role-based protection
*/