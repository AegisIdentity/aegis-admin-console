import { Avatar, Dropdown, Layout, Menu } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const { Header, Content } = Layout;

/** End-user ("My Apps") portal shell — a light top-bar layout, no admin sidebar. */
export function PortalLayout() {
  const { displayName, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 28px',
          borderBottom: '1px solid var(--aegis-border)',
        }}
      >
        <div className="aegis-brand">
          <img src="/shield.svg" width={24} height={24} alt="" />
          Aegis
        </div>
        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          onClick={({ key }) => navigate(key)}
          style={{ flex: 1, marginLeft: 32, borderBottom: 'none' }}
          items={[
            { key: '/my', label: 'My Apps' },
            { key: '/my/profile', label: 'Profile' },
            { key: '/my/security', label: 'Security' },
          ]}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/" style={{ fontWeight: 600 }}>
            Admin console →
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
        <div className="aegis-page" style={{ margin: '0 auto' }}>
          <Outlet />
        </div>
      </Content>
    </Layout>
  );
}
