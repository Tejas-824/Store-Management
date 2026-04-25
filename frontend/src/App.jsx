import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/users/UsersPage';
import UserFormPage from './pages/users/UserFormPage';
import RolesPage from './pages/roles/RolesPage';
import RoleFormPage from './pages/roles/RoleFormPage';
import StoresPage from './pages/stores/StoresPage';
import StoreFormPage from './pages/stores/StoreFormPage';
import StoreDetailPage from './pages/stores/StoreDetailPage';
import StoreUsersPage from './pages/stores/StoreUsersPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  return (
    <Routes>
      <Route path="/login"    element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />

          {/* ── Super Admin only — Store CRUD ── */}
          <Route path="stores" element={<ProtectedRoute role="Super Admin" />}>
            <Route index          element={<StoresPage />} />
            <Route path=":id"     element={<StoreDetailPage />} />
            <Route path="new"     element={<StoreFormPage />} />
            <Route path=":id/edit" element={<StoreFormPage />} />
          </Route>

          {/* ── Store Admin — manage their own store's users ── */}
          <Route path="my-store" element={<ProtectedRoute role="Store Admin" />}>
            <Route index element={<StoreUsersPage />} />
          </Route>

          {/* ── Users (Super Admin / Admin) ── */}
          <Route path="users" element={<ProtectedRoute permission="users:read" />}>
            <Route index          element={<UsersPage />} />
            <Route path="new"     element={<ProtectedRoute permission="users:write"><UserFormPage /></ProtectedRoute>} />
            <Route path=":id/edit" element={<ProtectedRoute permission="users:write"><UserFormPage /></ProtectedRoute>} />
          </Route>

          {/* ── Roles ── */}
          <Route path="roles" element={<ProtectedRoute permission="roles:read" />}>
            <Route index          element={<RolesPage />} />
            <Route path="new"     element={<ProtectedRoute permission="roles:write"><RoleFormPage /></ProtectedRoute>} />
            <Route path=":id/edit" element={<ProtectedRoute permission="roles:write"><RoleFormPage /></ProtectedRoute>} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}