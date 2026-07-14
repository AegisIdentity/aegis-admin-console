import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, Descriptions, List, Space, Switch, Tag, Typography, message } from 'antd';
import { PageHeader } from '../../components/PageHeader';
import { signupPolicyApi } from '../../api/endpoints';
import { config } from '../../config';
import { useAuth } from '../../auth/AuthContext';

const { Text, Paragraph } = Typography;

/**
 * Organization settings. Self-service sign-up is a live tenant-scoped toggle (identity-service), and the
 * Developer card surfaces the OIDC endpoints a tenant needs to connect their own web/mobile apps.
 */
export function Settings() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const tenant = (user?.profile?.tenant as string) ?? '—';
  const policy = useQuery({ queryKey: ['signup-policy'], queryFn: signupPolicyApi.get });

  const setEnabled = useMutation({
    mutationFn: (enabled: boolean) => signupPolicyApi.set(enabled),
    onSuccess: (res) => {
      message.success(res.signupEnabled ? 'Self-service sign-up enabled' : 'Self-service sign-up disabled');
      void qc.invalidateQueries({ queryKey: ['signup-policy'] });
    },
    onError: () => message.error('Could not update sign-up policy'),
  });

  const iss = config.oidcAuthority;
  const endpoints: { label: string; value: string }[] = [
    { label: 'Issuer', value: iss },
    { label: 'Discovery', value: `${iss}/.well-known/openid-configuration` },
    { label: 'Authorization', value: `${iss}/oauth2/authorize` },
    { label: 'Token', value: `${iss}/oauth2/token` },
    { label: 'JWKS', value: `${iss}/oauth2/jwks` },
    { label: 'UserInfo', value: `${iss}/userinfo` },
  ];

  const roadmap = [
    'Custom domains (verified CNAME) for a fully white-labelled sign-in host — tenant-service',
    'Admin roles (RBAC) — admin-api-service',
    'SCIM provisioning connectors (inbound / outbound) — scim-provisioning-service',
  ];

  return (
    <>
      <PageHeader title="Settings" description="Organization, self-service sign-up, and developer / API access." />

      <Card style={{ marginBottom: 24 }}>
        <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
          <div style={{ maxWidth: 640 }}>
            <Text strong>Self-service sign-up</Text>
            <Paragraph type="secondary" style={{ marginBottom: 0, marginTop: 4 }}>
              Let your customers create their own accounts in this organization via the public sign-up
              page (<code>/register</code>) or your app calling <code>POST /api/v1/signup</code>. When off,
              only admins and your backend (via the management API) can create users. Off by default.
            </Paragraph>
          </div>
          <Switch
            checked={policy.data?.signupEnabled ?? false}
            loading={policy.isLoading || setEnabled.isPending}
            onChange={(v) => setEnabled.mutate(v)}
            checkedChildren="On"
            unCheckedChildren="Off"
          />
        </Space>
      </Card>

      <Card title="Developer & API access" style={{ marginBottom: 24 }}>
        <Paragraph type="secondary">
          Connect your own web or mobile app to this organization. Register the app under{' '}
          <b>Applications</b> (choose OAuth for a user-facing app, or a service credential for
          machine-to-machine), then use <b>authorization_code + PKCE</b> against the endpoints below.
          Your organization identifier is <Text code>{tenant}</Text>.
        </Paragraph>
        <Descriptions column={1} size="small" bordered>
          {endpoints.map((e) => (
            <Descriptions.Item key={e.label} label={e.label}>
              <Text copyable style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{e.value}</Text>
            </Descriptions.Item>
          ))}
        </Descriptions>
        <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0, fontSize: 12 }}>
          Mobile apps use the same authorization_code + PKCE flow via a system browser
          (ASWebAuthenticationSession / Chrome Custom Tabs) with a custom-scheme or app-link redirect URI.
        </Paragraph>
      </Card>

      <Card title="On the roadmap">
        <List
          dataSource={roadmap}
          renderItem={(item) => (
            <List.Item>
              <Space>
                <Tag>soon</Tag>
                <Text type="secondary">{item}</Text>
              </Space>
            </List.Item>
          )}
        />
      </Card>
    </>
  );
}
