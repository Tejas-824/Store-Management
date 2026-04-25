import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../api/auth.api';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useState } from 'react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await authApi.register({
        name: data.name,
        email: data.email,
        password: data.password
      });

      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 px-4">

      <div className="w-full max-w-md">

        {/* HEADER */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-600 mb-4 shadow-lg">
            <Package className="text-white" size={28} />
          </div>

          <h1 className="text-3xl font-bold text-white">
            Create account
          </h1>

          <p className="text-gray-400 mt-1 text-sm">
            Get started with Store Management
          </p>
        </div>

        {/* CARD */}
        <div className="bg-white rounded-2xl shadow-xl p-8">

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

            {/* NAME */}
            <Input
              label="Full Name"
              placeholder="John Doe"
              error={errors.name?.message}
              {...register('name', {
                required: 'Name is required',
                minLength: {
                  value: 2,
                  message: 'At least 2 characters'
                },
              })}
            />

            {/* EMAIL */}
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Invalid email'
                },
              })}
            />

            {/* PASSWORD */}
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              helpText="Min 8 chars, uppercase, lowercase, number & special char"
              error={errors.password?.message}
              {...register('password', {
                required: 'Password required',
                minLength: {
                  value: 8,
                  message: 'Min 8 characters'
                },
                pattern: {
                  value: PASSWORD_PATTERN,
                  message: 'Must include upper, lower, number & special char'
                },
              })}
            />

            {/* CONFIRM PASSWORD */}
            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              error={errors.confirm?.message}
              {...register('confirm', {
                required: 'Please confirm password',
                validate: v => v === watch('password') || 'Passwords do not match',
              })}
            />

            {/* BUTTON (IMPROVED LIKE LOGIN PAGE) */}
            <Button
              type="submit"
              loading={loading}
              className="w-full flex items-center justify-center bg-black text-white hover:bg-gray-900 py-3 rounded-lg font-medium transition-all duration-200 active:scale-[0.98]"
            >
              Create Account
            </Button>

          </form>

          {/* FOOTER */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-primary-600 font-medium hover:underline"
            >
              Sign In
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}