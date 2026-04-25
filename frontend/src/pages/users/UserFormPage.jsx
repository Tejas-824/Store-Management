import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { usersApi } from '../../api/users.api';
import { rolesApi } from '../../api/roles.api';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

export default function UserFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: userData } = useQuery({
    queryKey: ['user', id],
    queryFn: () => usersApi.getById(id),
    enabled: isEdit,
  });

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.getAll(),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (userData?.data?.data) {
      const user = userData.data.data;
      reset({
        name: user.name,
        email: user.email,
        is_active: user.is_active,
        roleIds: user.roles?.map(r => r.id) || [],
      });
    }
  }, [userData]);

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? usersApi.update(id, data) : usersApi.create(data),
    onSuccess: () => {
      toast.success(isEdit ? 'User updated' : 'User created');
      qc.invalidateQueries({ queryKey: ['users'] });
      navigate('/users');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Operation failed'),
  });

  const roles = rolesData?.data?.data || [];
  const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/users')} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="page-title">{isEdit ? 'Edit User' : 'Add User'}</h1>
          <p className="page-subtitle">{isEdit ? 'Update user information' : 'Create a new user account'}</p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit(data => mutation.mutate(data))} className="space-y-5" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Full Name" error={errors.name?.message} {...register('name', { required: 'Name required', minLength: { value: 2, message: 'Min 2 chars' } })} />
            <Input label="Email" type="email" error={errors.email?.message} {...register('email', { required: 'Email required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' } })} />
          </div>

          {!isEdit && (
            <Input
              label="Password"
              type="password"
              helpText="Min 8 chars with uppercase, lowercase, number & special char"
              error={errors.password?.message}
              {...register('password', {
                required: 'Password required',
                minLength: { value: 8, message: 'Min 8 chars' },
                pattern: { value: PASSWORD_PATTERN, message: 'Must include upper, lower, number & special char' },
              })}
            />
          )}

          <div className="space-y-1">
            <label className="form-label">Assign Roles</label>
            <div className="grid grid-cols-2 gap-2">
              {roles.map(role => (
                <label key={role.id} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="checkbox" value={role.id} className="rounded"
                    {...register('roleIds')} defaultChecked={userData?.data?.data?.roles?.some(r => r.id === role.id)}
                  />
                  <div>
                    <div className="text-sm font-medium">{role.name}</div>
                    <div className="text-xs text-gray-400">{role.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {isEdit && (
            <div className="space-y-1">
              <label className="form-label">Account Status</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded" {...register('is_active')} />
                <span className="text-sm text-gray-700">Active account</span>
              </label>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => navigate('/users')}>Cancel</Button>
            <Button type="submit" loading={mutation.isPending}>{isEdit ? 'Save Changes' : 'Create User'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}