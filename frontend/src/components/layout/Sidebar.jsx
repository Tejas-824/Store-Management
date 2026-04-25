import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Shield, Store, LogOut, X, Package, UserCog } from 'lucide-react';
import { usePermission } from '../../hooks/usePermission';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/authStore';

export default function Sidebar({ open, onClose }) {
  const { hasPermission, user } = usePermission();
  const { hasRole } = useAuthStore();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const isSuperAdmin = hasRole('Super Admin');
  const isStoreAdmin = hasRole('Store Admin');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const content = (
    <div className="flex flex-col h-full bg-gray-900 text-white w-64">
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Package className="text-primary-400" size={24} />
          <span className="font-bold text-lg">StoreMgmt</span>
        </div>
        <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white">
          <X size={20} />
        </button>
      </div>

      {/* Role Badge */}
      <div className="px-4 pt-3 pb-1">
        <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300 font-medium">
          {user?.roles?.[0] || 'User'}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {/* Dashboard — everyone sees this */}
        <NavLink
          to="/"
          end
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`
          }
        >
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>

        {/* Stores — Super Admin ONLY */}
        {isSuperAdmin && (
          <NavLink
            to="/stores"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Store size={18} />
            Stores
          </NavLink>
        )}

        {/* My Store — Store Admin ONLY */}
        {isStoreAdmin && (
          <NavLink
            to="/my-store"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <UserCog size={18} />
            My Store
          </NavLink>
        )}

        {/* Users — permission-based */}
        {hasPermission('users:read') && !isStoreAdmin && (
          <NavLink
            to="/users"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Users size={18} />
            Users
          </NavLink>
        )}

        {/* Roles — Super Admin / Admin only */}
        {hasPermission('roles:read') && isSuperAdmin && (
          <NavLink
            to="/roles"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Shield size={18} />
            Roles & Permissions
          </NavLink>
        )}
      </nav>

      {/* User info + logout */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-sm font-bold uppercase flex-shrink-0">
            {user?.name?.[0]}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden lg:flex shrink-0">{content}</div>
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="shrink-0">{content}</div>
          <div className="flex-1 bg-black/50" onClick={onClose} />
        </div>
      )}
    </>
  );
}