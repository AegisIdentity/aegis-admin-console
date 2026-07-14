import { Avatar, Dropdown, Layout, Menu, Tag } from 'antd';
import {
  AppstoreOutlined,
  BgColorsOutlined,
  DashboardOutlined,
  FileSearchOutlined,
  GlobalOutlined,
  LogoutOutlined,
  SafetyOutlined,
  SettingOutlined,
  TeamOutlined,
  UsergroupAddOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const { Header, Sider, Content } = Layout;

const NAV = [
  { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
  {
    key: 'directory',
    icon: <TeamOutlined />,
    label: 'Directory',
    children: [
      { key: '/users', label: 'Users' },
      { key: '/groups', label: 'Groups', icon: <UsergroupAddOutlined /> },
      { key: '/provisioning', label: 'Provisioning (SCIM)' },
    ],
  },
  { key: '/applications', icon: <AppstoreOutlined />, label: 'Applications' },
  {
    key: 'security',
    icon: <SafetyOutlined />,
    label: 'Security',
    children: [
      { key: '/identity-providers', label: 'Identity Providers', icon: <GlobalOutlined /> },
      { key: '/policies', label: 'Authentication Policies' },
      { key: '/passkeys', label: 'Passkeys' },
      { key: '/admins', label: 'Admins & Roles' },
    ],
  },
  { key: '/domains', icon: <GlobalOutlined />, label: 'Custom Domains' },
  { key: '/branding', icon: <BgColorsOutlined />, label: 'Branding' },
  { key: '/system-log', icon: <FileSearchOutlined />, label: 'System Log' },
  { key: '/settings', icon: <SettingOutlined />, label: 'Settings' },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { displayName, tenant, logout } = useAuth();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={248} breakpoint="lg" collapsedWidth={0}>
        <div className="aegis-sidebar-logo">
          <img src="/shield.svg" width={26} height={26} alt="" />
          Aegis Admin
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={['directory', 'security']}
          items={NAV}
          onClick={({ key }) => navigate(key)}
          style={{ background: 'transparent', borderInlineEnd: 'none' }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            borderBottom: '1px solid var(--aegis-border)',
          }}
        >
          <div className="aegis-brand" style={{ color: '#1e2532' }}>
            {tenant ? <Tag color="blue">{tenant}</Tag> : <Tag>no tenant</Tag>}
            <span style={{ color: 'var(--aegis-text-muted)', fontWeight: 500 }}>Organization</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link to="/my" style={{ fontWeight: 600 }}>
              My Apps →
            </Link>
            <Dropdown
              menu={{
                items: [
                  { key: 'name', label: displayName, disabled: true },
                  { type: 'divider' },
                  { key: 'logout', icon: <LogoutOutlined />, label: 'Sign out', onClick: logout },
                ],
              }}
            >
              <Avatar style={{ background: 'var(--aegis-primary)', cursor: 'pointer' }} icon={<UserOutlined />} />
            </Dropdown>
          </div>
        </Header>
        <Content>
          <div className="aegis-page">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
