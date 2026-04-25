import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth.api';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const { setAuth, clearAuth, user, isAuthenticated } = useAuthStore();

  const login = async (credentials) => {
    const { data } = await authApi.login(credentials);
    setAuth(data.data);
    return data;
  };

  const logout = async () => {
    try {
      await authApi.logout({ refreshToken: useAuthStore.getState().refreshToken });
    } catch {}
    clearAuth();
    toast.success('Logged out successfully');
  };

  return { login, logout, user, isAuthenticated };
};