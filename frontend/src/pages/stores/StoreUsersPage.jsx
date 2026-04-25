import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { UserPlus, Trash2, Store, Users, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { storesApi } from '../../api/stores.api';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/;

export default function StoreUsersPage() {
  const user = useAuthStore(s => s.user);
  const storeId = user?.store_id;
  const qc = useQueryClient();

  const [addModalOpen, setAddModalOpen]   = useState(false);
  const [deleteTarget, setDeleteTarget]   = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['store-users', storeId],
    queryFn: () => storesApi.getStoreUsers(storeId),
    enabled: !!storeId,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const addMutation = useMutation({
    mutationFn: (formData) => storesApi.addUserToStore(storeId, formData),
    onSuccess: () => {
      toast.success('User added to store');
      setAddModalOpen(false);
      reset();
      qc.invalidateQueries({ queryKey: ['store-users', storeId] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add user'),
  });

  const removeMutation = useMutation({
    mutationFn: (userId) => storesApi.removeUserFromStore(storeId, userId),
    onSuccess: () => {
      toast.success('User removed from store');
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: ['store-users', storeId] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to remove user'),
  });

  const store = data?.data?.data?.store;
  const users = data?.data?.data?.users || [];

  if (!storeId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Store size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-lg font-semibold text-gray-700">No Store Assigned</h2>
          <p className="text-gray-400 text-sm mt-1">Contact the Super Admin to assign you to a store.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">My Store</h1>
          <p className="page-subtitle">
            {isLoading ? 'Loading...' : store?.name || 'Store Management'}
          </p>
        </div>
        <Button icon={UserPlus} onClick={() => setAddModalOpen(true)}>
          Add User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Users size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="text-2xl font-bold text-gray-800">
              {isLoading ? '—' : users.length}
            </p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-purple-100 rounded-xl">
            <ShieldCheck size={20} className="text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Store Admins</p>
            <p className="text-2xl font-bold text-gray-800">
              {isLoading ? '—' : users.filter(u => u.is_admin).length}
            </p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">Store Members</h2>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Users size={40} className="mx-auto mb-3 opacity-40" />
            <p>No users in this store yet.</p>
            <p className="text-sm mt-1">Click "Add User" to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-sm uppercase">
                    {u.name?.[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 text-sm">{u.name}</p>
                      {u.is_admin && <Badge variant="info">Store Admin</Badge>}
                    </div>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant={u.is_active ? 'success' : 'danger'}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <span className="text-xs text-gray-400 hidden sm:block">
                    Added {new Date(u.joined_at).toLocaleDateString()}
                  </span>
                  {/* Can't remove admin or yourself */}
                  {!u.is_admin && u.id !== user?.id && (
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={Trash2}
                      className="text-red-500 hover:bg-red-50 hover:text-red-600"
                      onClick={() => setDeleteTarget(u)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => { setAddModalOpen(false); reset(); }}
        title="Add User to Store"
        size="md"
      >
        <form onSubmit={handleSubmit(data => addMutation.mutate(data))} className="space-y-4" noValidate>
          <Input
            label="Full Name"
            placeholder="John Doe"
            error={errors.name?.message}
            {...register('name', {
              required: 'Name is required',
              minLength: { value: 2, message: 'Min 2 characters' },
            })}
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="user@example.com"
            error={errors.email?.message}
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
            })}
          />
          <Input
            label="Password"
            type="password"
            helpText="Min 8 chars with uppercase, lowercase, number & special char"
            error={errors.password?.message}
            {...register('password', {
              required: 'Password required',
              minLength: { value: 8, message: 'Min 8 characters' },
              pattern: {
                value: PASSWORD_PATTERN,
                message: 'Must include upper, lower, number & special char',
              },
            })}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              type="button"
              onClick={() => { setAddModalOpen(false); reset(); }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={addMutation.isPending} icon={UserPlus}>
              Add User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Remove Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => removeMutation.mutate(deleteTarget.id)}
        loading={removeMutation.isPending}
        title="Remove User"
        message={`Remove "${deleteTarget?.name}" from this store? They will lose access but their account will remain.`}
      />
    </div>
  );
}