import { Navigate, Outlet } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from './AuthContext';

/** Route guard: unauthenticated users are sent to the branded sign-in page. */
export function RequireAuth() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }
  return isAuthenticated ? <Outlet /> : <Navigate to="/signin" replace />;
}
