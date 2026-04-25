import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { usersApi } from '../../api/users.api';
import { usePermission } from '../../hooks/usePermission';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export default function UsersPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { hasPermission } = usePermission();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users', { page, search }],
    queryFn: () => usersApi.getAll({ page, limit: 10, search }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => usersApi.delete(id),
    onSuccess: () => {
      toast.success('User deleted');
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed'),
  });

  const columns = [
    { key: 'name', label: 'Name', render: (v, row) => (
      <div>
        <div className="font-medium text-gray-900">{v}</div>
        <div className="text-xs text-gray-400">{row.email}</div>
      </div>
    )},
    { key: 'roles', label: 'Roles', render: (v) =>
      v?.length ? v.map(r => <Badge key={r} className="mr-1">{r}</Badge>) : <Badge variant="gray">No Role</Badge>
    },
    { key: 'is_active', label: 'Status', render: (v) =>
      <Badge variant={v ? 'success' : 'danger'}>{v ? 'Active' : 'Inactive'}</Badge>
    },
    { key: 'last_login_at', label: 'Last Login', render: (v) =>
      v ? new Date(v).toLocaleDateString() : 'Never'
    },
    { key: 'actions', label: 'Actions', render: (_, row) => (
      <div className="flex gap-2">
        {hasPermission('users:write') && (
          <Button size="sm" variant="ghost" icon={Pencil} onClick={() => navigate(`/users/${row.id}/edit`)}>
            Edit
          </Button>
        )}
        {hasPermission('users:delete') && (
          <Button size="sm" variant="ghost" icon={Trash2}
            className="text-red-500 hover:bg-red-50 hover:text-red-600"
            onClick={() => setDeleteTarget(row)}
          >
            Delete
          </Button>
        )}
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Users</h1><p className="page-subtitle">Manage user accounts</p></div>
        {hasPermission('users:write') && (
          <Button icon={Plus} onClick={() => navigate('/users/new')}>Add User</Button>
        )}
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Search users..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>
        <Table columns={columns} data={data?.data?.data || []} loading={isLoading} emptyMessage="No users found" />
        <Pagination pagination={data?.data?.pagination} onChange={setPage} />
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        loading={deleteMutation.isPending}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}