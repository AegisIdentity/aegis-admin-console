import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from './components/AdminLayout';
import { PortalLayout } from './components/PortalLayout';
import { RequireAuth } from './auth/RequireAuth';
import { Callback } from './auth/Callback';
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';
import { Register } from './pages/Register';
import { Dashboard } from './pages/admin/Dashboard';
import { Users } from './pages/admin/Users';
import { Groups } from './pages/admin/Groups';
import { Applications } from './pages/admin/Applications';
import { SystemLog } from './pages/admin/SystemLog';
import { Settings } from './pages/admin/Settings';
import { IdentityProviders } from './pages/admin/IdentityProviders';
import { AuthPolicies, Branding } from './pages/admin/StructuredPages';
import { MyApps, Profile, Security } from './pages/portal/PortalPages';

export function App() {
  return (
    <Routes>
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/register" element={<Register />} />
      <Route path="/callback" element={<Callback />} />

      <Route element={<RequireAuth />}>
        {/* Admin console */}
        <Route element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="groups" element={<Groups />} />
          <Route path="applications" element={<Applications />} />
          <Route path="identity-providers" element={<IdentityProviders />} />
          <Route path="policies" element={<AuthPolicies />} />
          <Route path="branding" element={<Branding />} />
          <Route path="system-log" element={<SystemLog />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* End-user portal */}
        <Route path="my" element={<PortalLayout />}>
          <Route index element={<MyApps />} />
          <Route path="profile" element={<Profile />} />
          <Route path="security" element={<Security />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
