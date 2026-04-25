import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { rolesApi } from '../../api/roles.api';
import { usePermission } from '../../hooks/usePermission';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export default function RolesPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { hasPermission } = usePermission();
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => rolesApi.delete(id),
    onSuccess: () => {
      toast.success('Role deleted');
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed'),
  });

  const roles = data?.data?.data || [];

  if (isLoading) return <div className="text-center py-12 text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Roles & Permissions</h1><p className="page-subtitle">Control access across the system</p></div>
        {hasPermission('roles:write') && (
          <Button icon={Plus} onClick={() => navigate('/roles/new')}>Add Role</Button>
        )}
      </div>

      <div className="grid gap-4">
        {roles.map(role => (
          <div key={role.id} className="card">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Shield size={18} className="text-purple-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{role.name}</h3>
                    {role.is_system && <Badge variant="info">System</Badge>}
                  </div>
                  <p className="text-xs text-gray-500">{role.description}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {hasPermission('roles:write') && !role.is_system && (
                  <Button size="sm" variant="ghost" icon={Pencil} onClick={() => navigate(`/roles/${role.id}/edit`)}>Edit</Button>
                )}
                {hasPermission('roles:delete') && !role.is_system && (
                  <Button size="sm" variant="ghost" icon={Trash2}
                    className="text-red-500 hover:bg-red-50"
                    onClick={() => setDeleteTarget(role)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
              <span>{role.user_count || 0} users</span>
              <span>·</span>
              <span>{role.permissions?.length || 0} permissions</span>
            </div>

            {role.permissions?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {role.permissions.map(p => (
                  <Badge key={p.id} variant="gray">{p.name}</Badge>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        loading={deleteMutation.isPending}
        title="Delete Role"
        message={`Delete role "${deleteTarget?.name}"? Users assigned this role will lose its permissions.`}
      />
    </div>
  );
}