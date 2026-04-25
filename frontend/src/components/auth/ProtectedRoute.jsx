import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function ProtectedRoute({ permission, role, children }) {
  const { isAuthenticated, hasPermission, hasRole } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Role-based check
  if (role && !hasRole(role)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-500 text-sm">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  // Permission-based check
  if (permission && !hasPermission(permission)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-500 text-sm">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return children ?? <Outlet />;
}