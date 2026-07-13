import { useQuery } from '@tanstack/react-query';
import { Card, List, Statistic } from 'antd';
import {
  AppstoreOutlined,
  GlobalOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { appsApi, idpApi, usersApi } from '../../api/endpoints';
import { useAuth } from '../../auth/AuthContext';

export function Dashboard() {
  const { displayName } = useAuth();
  const users = useQuery({ queryKey: ['users'], queryFn: usersApi.list });
  const apps = useQuery({ queryKey: ['apps'], queryFn: appsApi.list });
  const idps = useQuery({ queryKey: ['idps'], queryFn: idpApi.list });

  const stats = [
    { title: 'Users', value: users.data?.length ?? 0, icon: <TeamOutlined />, to: '/users' },
    { title: 'Applications', value: apps.data?.length ?? 0, icon: <AppstoreOutlined />, to: '/applications' },
    { title: 'Identity Providers', value: idps.data?.length ?? 0, icon: <GlobalOutlined />, to: '/identity-providers' },
    { title: 'MFA policies', value: 1, icon: <SafetyCertificateOutlined />, to: '/policies' },
  ];

  return (
    <>
      <PageHeader title={`Welcome, ${displayName}`} description="Your organization at a glance." />
      <div className="aegis-stat-grid">
        {stats.map((s) => (
          <Link key={s.title} to={s.to}>
            <Card hoverable>
              <Statistic title={s.title} value={s.value} prefix={s.icon} />
            </Card>
          </Link>
        ))}
      </div>
      <Card title="Get started">
        <List
          itemLayout="horizontal"
          dataSource={[
            { t: 'Add your first users', d: 'Create accounts or import your directory.', to: '/users' },
            { t: 'Register an application', d: 'Add an OIDC or SAML app integration.', to: '/applications' },
            { t: 'Connect an identity provider', d: 'Let users sign in with Google, Microsoft, or a corporate IdP.', to: '/identity-providers' },
            { t: 'Set an authentication policy', d: 'Require MFA and configure sign-on rules.', to: '/policies' },
          ]}
          renderItem={(i) => (
            <List.Item actions={[<Link key="go" to={i.to}>Open</Link>]}>
              <List.Item.Meta title={i.t} description={i.d} />
            </List.Item>
          )}
        />
      </Card>
    </>
  );
}
