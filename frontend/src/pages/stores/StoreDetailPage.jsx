import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Pencil, MapPin, Phone, Mail, Globe, User } from 'lucide-react';
import { storesApi } from '../../api/stores.api';
import { usePermission } from '../../hooks/usePermission';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

const InfoRow = ({ icon: Icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <Icon size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm text-gray-800">{value}</p>
      </div>
    </div>
  );
};

export default function StoreDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermission();

  const { data, isLoading } = useQuery({
    queryKey: ['store', id],
    queryFn: () => storesApi.getById(id),
  });

  if (isLoading) return <div className="text-center py-12 text-gray-400">Loading...</div>;

  const store = data?.data?.data;
  if (!store) return <div className="text-center py-12 text-gray-400">Store not found</div>;

  const address = [store.address, store.city, store.state, store.zip_code, store.country].filter(Boolean).join(', ');

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/stores')} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="page-title">{store.name}</h1>
              <Badge variant={store.is_active ? 'success' : 'danger'}>{store.is_active ? 'Active' : 'Inactive'}</Badge>
            </div>
            {store.description && <p className="page-subtitle">{store.description}</p>}
          </div>
        </div>
        {hasPermission('stores:write') && (
          <Button icon={Pencil} onClick={() => navigate(`/stores/${id}/edit`)}>Edit</Button>
        )}
      </div>

      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Contact & Location</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <InfoRow icon={MapPin} label="Address" value={address} />
          <InfoRow icon={Phone} label="Phone" value={store.phone} />
          <InfoRow icon={Mail} label="Email" value={store.email} />
          <InfoRow icon={Globe} label="Website" value={store.website} />
          <InfoRow icon={User} label="Owner" value={store.owner?.name} />
        </div>
      </div>

      <div className="card text-xs text-gray-400 space-y-1">
        <p>Created: {new Date(store.created_at).toLocaleString()}</p>
        {store.updated_at && <p>Updated: {new Date(store.updated_at).toLocaleString()}</p>}
        {store.created_by_user?.name && <p>By: {store.created_by_user.name}</p>}
      </div>
    </div>
  );
}