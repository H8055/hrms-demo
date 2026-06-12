import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, roles, permission }) {
  const { user, loading, isAuthenticated, hasPermission } = useAuth();

  if (loading) {
    return <div className="screen-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  if (permission && !hasPermission(permission.module, permission.action || 'view')) {
    return <Navigate to="/" replace />;
  }

  return children;
}
