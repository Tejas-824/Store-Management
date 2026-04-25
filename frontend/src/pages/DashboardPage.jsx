import { useQuery } from '@tanstack/react-query';
import { Users, Store, Shield, UserCog } from 'lucide-react';
import { usersApi } from '../api/users.api';
import { storesApi } from '../api/stores.api';
import { rolesApi } from '../api/roles.api';
import { usePermission } from '../hooks/usePermission';
import { useAuthStore } from '../store/authStore';

const StatCard = ({ title, value, icon: Icon, color, loading }) => (
  <div className="card flex items-center gap-4">
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      {loading
        ? <div className="h-7 w-16 bg-gray-200 rounded animate-pulse mt-1" />
        : <p className="text-2xl font-bold text-gray-800">{value ?? '—'}</p>
      }
    </div>
  </div>
);

// ── Super Admin Dashboard ──────────────────────────────────────────────────────
function SuperAdminDashboard() {
  const { hasPermission } = usePermission();

  const { data: users,  isLoading: uL } = useQuery({
    queryKey: ['users', { limit: 1 }],
    queryFn:  () => usersApi.getAll({ limit: 1 }),
    enabled:  hasPermission('users:read'),
    select:   d => d.data.pagination.total,
  });
  const { data: stores, isLoading: sL } = useQuery({
    queryKey: ['stores', { limit: 1 }],
    queryFn:  () => storesApi.getAll({ limit: 1 }),
    enabled:  hasPermission('stores:read'),
    select:   d => d.data.pagination.total,
  });
  const { data: roles,  isLoading: rL } = useQuery({
    queryKey: ['roles'],
    queryFn:  () => rolesApi.getAll(),
    enabled:  hasPermission('roles:read'),
    select:   d => d.data.data.length,
  });

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {hasPermission('users:read')  && <StatCard title="Total Users"  value={users}  icon={Users}  color="bg-blue-500"   loading={uL} />}
        {hasPermission('stores:read') && <StatCard title="Total Stores" value={stores} icon={Store}  color="bg-green-500"  loading={sL} />}
        {hasPermission('roles:read')  && <StatCard title="Total Roles"  value={roles}  icon={Shield} color="bg-purple-500" loading={rL} />}
      </div>
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-3 gap-4 text-sm text-gray-600">
          <div className="p-3 bg-gray-50 rounded-lg">🏪 Create stores and assign Store Admins</div>
          <div className="p-3 bg-gray-50 rounded-lg">👤 Manage users and assign roles</div>
          <div className="p-3 bg-gray-50 rounded-lg">🔒 Configure roles & permissions</div>
        </div>
      </div>
    </>
  );
}

// ── Store Admin Dashboard ──────────────────────────────────────────────────────
function StoreAdminDashboard() {
  const user = useAuthStore(s => s.user);
  const storeId = user?.store_id;

  const { data, isLoading } = useQuery({
    queryKey: ['store-users', storeId],
    queryFn:  () => storesApi.getStoreUsers(storeId),
    enabled:  !!storeId,
  });

  const store = data?.data?.data?.store;
  const users = data?.data?.data?.users || [];
  const totalUsers = users.filter(u => !u.is_admin).length;

  return (
    <>
      {store && (
        <div className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white">
          <div className="flex items-center gap-3">
            <Store size={28} />
            <div>
              <p className="text-primary-200 text-sm">You are managing</p>
              <h2 className="text-xl font-bold">{store.name}</h2>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <StatCard title="Store Users" value={totalUsers} icon={Users}   color="bg-blue-500"  loading={isLoading} />
        <StatCard title="Your Role"   value="Store Admin" icon={UserCog} color="bg-purple-500" loading={false} />
      </div>
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-600">
          <div className="p-3 bg-gray-50 rounded-lg">👤 Add new users to your store via "My Store"</div>
          <div className="p-3 bg-gray-50 rounded-lg">🗑️ Remove users who no longer need access</div>
        </div>
      </div>
    </>
  );
}

// ── Store User Dashboard ───────────────────────────────────────────────────────
function StoreUserDashboard() {
  const user = useAuthStore(s => s.user);
  return (
    <div className="card text-center py-12">
      <Store size={48} className="mx-auto text-gray-300 mb-4" />
      <h2 className="text-lg font-semibold text-gray-700">Welcome, {user?.name}</h2>
      <p className="text-gray-400 text-sm mt-2">
        You are a member of a store. Contact your Store Admin for access.
      </p>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { hasRole } = useAuthStore();

  const isSuperAdmin = hasRole('Super Admin') || hasRole('Admin');
  const isStoreAdmin = hasRole('Store Admin');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          {isSuperAdmin ? 'System overview' : isStoreAdmin ? 'Store overview' : 'Welcome'}
        </p>
      </div>

      {isSuperAdmin && <SuperAdminDashboard />}
      {!isSuperAdmin && isStoreAdmin && <StoreAdminDashboard />}
      {!isSuperAdmin && !isStoreAdmin && <StoreUserDashboard />}
    </div>
  );
}