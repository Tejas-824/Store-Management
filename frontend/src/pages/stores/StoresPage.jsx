import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, Eye, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { storesApi } from '../../api/stores.api';
import { usePermission } from '../../hooks/usePermission';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export default function StoresPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { hasPermission } = usePermission();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['stores', { page, search }],
    queryFn: () => storesApi.getAll({ page, limit: 10, search }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => storesApi.delete(id),
    onSuccess: () => {
      toast.success('Store deleted');
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: ['stores'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed'),
  });

  const columns = [
    { key: 'name', label: 'Store', render: (v, row) => (
      <div>
        <div className="font-medium text-gray-900">{v}</div>
        {(row.city || row.country) && (
          <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
            <MapPin size={10} />{[row.city, row.country].filter(Boolean).join(', ')}
          </div>
        )}
      </div>
    )},
    { key: 'owner', label: 'Owner', render: (v) => v?.name || '—' },
    { key: 'phone', label: 'Phone' },
    { key: 'is_active', label: 'Status', render: (v) =>
      <Badge variant={v ? 'success' : 'danger'}>{v ? 'Active' : 'Inactive'}</Badge>
    },
    { key: 'actions', label: 'Actions', render: (_, row) => (
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" icon={Eye} onClick={() => navigate(`/stores/${row.id}`)}>View</Button>
        {hasPermission('stores:write') && (
          <Button size="sm" variant="ghost" icon={Pencil} onClick={() => navigate(`/stores/${row.id}/edit`)}>Edit</Button>
        )}
        {hasPermission('stores:delete') && (
          <Button size="sm" variant="ghost" icon={Trash2}
            className="text-red-500 hover:bg-red-50"
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
        <div><h1 className="page-title">Stores</h1><p className="page-subtitle">Manage your store locations</p></div>
        {hasPermission('stores:write') && (
          <Button icon={Plus} onClick={() => navigate('/stores/new')}>Add Store</Button>
        )}
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Search stores..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>
        <Table columns={columns} data={data?.data?.data || []} loading={isLoading} emptyMessage="No stores found" />
        <Pagination pagination={data?.data?.pagination} onChange={setPage} />
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        loading={deleteMutation.isPending}
        title="Delete Store"
        message={`Delete store "${deleteTarget?.name}"? This cannot be undone.`}
      />
    </div>
  );
}