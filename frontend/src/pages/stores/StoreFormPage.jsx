import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { storesApi } from '../../api/stores.api';
import { usersApi } from '../../api/users.api';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';

export default function StoreFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: storeData } = useQuery({ queryKey: ['store', id], queryFn: () => storesApi.getById(id), enabled: isEdit });
  const { data: usersData } = useQuery({ queryKey: ['users', { limit: 100 }], queryFn: () => usersApi.getAll({ limit: 100, is_active: true }) });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (storeData?.data?.data) {
      const s = storeData.data.data;
      reset({ name: s.name, description: s.description, address: s.address, city: s.city, state: s.state, zip_code: s.zip_code, country: s.country, phone: s.phone, email: s.email, website: s.website, owner_id: s.owner?.id || '' });
    }
  }, [storeData]);

  const mutation = useMutation({
    mutationFn: (data) => {
      const payload = { ...data };
      if (!payload.owner_id) delete payload.owner_id;
      if (!payload.website) delete payload.website;
      return isEdit ? storesApi.update(id, payload) : storesApi.create(payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Store updated' : 'Store created');
      qc.invalidateQueries({ queryKey: ['stores'] });
      navigate('/stores');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Operation failed'),
  });

  const users = usersData?.data?.data || [];
  const ownerOptions = users.map(u => ({ value: u.id, label: `${u.name} (${u.email})` }));

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/stores')} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></button>
        <div>
          <h1 className="page-title">{isEdit ? 'Edit Store' : 'Add Store'}</h1>
          <p className="page-subtitle">{isEdit ? 'Update store details' : 'Register a new store'}</p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit(data => mutation.mutate(data))} className="space-y-5" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input label="Store Name *" error={errors.name?.message}
                {...register('name', { required: 'Store name required', minLength: { value: 2, message: 'Min 2 chars' } })} />
            </div>
            <div className="col-span-2">
              <div className="space-y-1">
                <label className="form-label">Description</label>
                <textarea rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  {...register('description')} />
              </div>
            </div>
            <div className="col-span-2">
              <Input label="Address" {...register('address')} />
            </div>
            <Input label="City" {...register('city')} />
            <Input label="State" {...register('state')} />
            <Input label="ZIP Code" {...register('zip_code')} />
            <Input label="Country" {...register('country')} />
            <Input label="Phone" {...register('phone')} />
            <Input label="Email" type="email" error={errors.email?.message}
              {...register('email', { pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' } })} />
            <div className="col-span-2">
              <Input label="Website" type="url" placeholder="https://..." error={errors.website?.message} {...register('website')} />
            </div>
            <div className="col-span-2">
              <Select label="Store Owner" options={ownerOptions} placeholder="Select owner (optional)" {...register('owner_id')} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => navigate('/stores')}>Cancel</Button>
            <Button type="submit" loading={mutation.isPending}>{isEdit ? 'Save Changes' : 'Create Store'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}