import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { rolesApi } from '../../api/roles.api';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const RESOURCE_LABELS = { users: 'Users', roles: 'Roles & Permissions', stores: 'Stores' };

export default function RoleFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: roleData } = useQuery({ queryKey: ['role', id], queryFn: () => rolesApi.getById(id), enabled: isEdit });
  const { data: permsData } = useQuery({ queryKey: ['permissions'], queryFn: () => rolesApi.getPermissions() });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (roleData?.data?.data) {
      const role = roleData.data.data;
      reset({ name: role.name, description: role.description, permissionIds: role.permissions?.map(p => p.id) || [] });
    }
  }, [roleData]);

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? rolesApi.update(id, data) : rolesApi.create(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Role updated' : 'Role created');
      qc.invalidateQueries({ queryKey: ['roles'] });
      navigate('/roles');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Operation failed'),
  });

  const permissions = permsData?.data?.data || [];
  const grouped = permissions.reduce((acc, p) => {
    if (!acc[p.resource]) acc[p.resource] = [];
    acc[p.resource].push(p);
    return acc;
  }, {});

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/roles')} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="page-title">{isEdit ? 'Edit Role' : 'Create Role'}</h1>
          <p className="page-subtitle">Configure role permissions</p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit(data => mutation.mutate(data))} className="space-y-6" noValidate>
          <Input label="Role Name" error={errors.name?.message} {...register('name', { required: 'Name required', minLength: { value: 2, message: 'Min 2 chars' } })} />
          <Input label="Description" error={errors.description?.message} {...register('description')} />

          <div className="space-y-3">
            <label className="form-label">Permissions</label>
            {Object.entries(grouped).map(([resource, perms]) => (
              <div key={resource} className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 capitalize">{RESOURCE_LABELS[resource] || resource}</h4>
                <div className="grid grid-cols-3 gap-2">
                  {perms.map(perm => (
                    <label key={perm.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" value={perm.id} className="rounded" {...register('permissionIds')}
                        defaultChecked={roleData?.data?.data?.permissions?.some(p => p.id === perm.id)}
                      />
                      <span className="capitalize">{perm.action}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => navigate('/roles')}>Cancel</Button>
            <Button type="submit" loading={mutation.isPending}>{isEdit ? 'Save Changes' : 'Create Role'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}