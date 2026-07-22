import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requireSuperAdmin = false }) {
  const { user, isSuperAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (requireSuperAdmin && !isSuperAdmin) return <Navigate to="/" replace />;
  return children;
}
