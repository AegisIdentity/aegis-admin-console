import { Card, Descriptions, Empty } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';
import { PageHeader } from '../../components/PageHeader';
import { FeaturePage } from '../../components/FeaturePage';
import { useAuth } from '../../auth/AuthContext';

/** End-user app dashboard — the "chiclets" a signed-in user launches. Assignments come from the
 * directory once the assignment API is wired; illustrative tiles are shown meanwhile. */
export function MyApps() {
  const { displayName } = useAuth();
  const tiles = [
    { name: 'Acme Portal', color: '#3b5bdb' },
    { name: 'Analytics', color: '#7048e8' },
    { name: 'Support Desk', color: '#0ca678' },
  ];
  return (
    <>
      <PageHeader title={`Hi, ${displayName}`} description="Your applications." />
      {tiles.length === 0 ? (
        <Empty description="No apps assigned yet" />
      ) : (
        <div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}
        >
          {tiles.map((t) => (
            <Card key={t.name} hoverable style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: t.color,
                  margin: '4px auto 12px',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#fff',
                  fontSize: 22,
                }}
              >
                <AppstoreOutlined />
              </div>
              <div style={{ fontWeight: 600 }}>{t.name}</div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

export function Profile() {
  const { user } = useAuth();
  const p = user?.profile;
  return (
    <>
      <PageHeader title="Profile" description="Your account details." />
      <Card>
        <Descriptions column={1} bordered>
          <Descriptions.Item label="Name">{(p?.name as string) ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Username">{(p?.preferred_username as string) ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Email">{(p?.email as string) ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Subject (sub)">{(p?.sub as string) ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Tenant">{(p?.tenant as string) ?? '—'}</Descriptions.Item>
        </Descriptions>
      </Card>
    </>
  );
}

export function Security() {
  return (
    <FeaturePage
      title="Security"
      description="Manage how you sign in and protect your account."
      capabilities={[
        'Register a passkey (WebAuthn/FIDO2) for passwordless sign-in',
        'Set up an authenticator app (TOTP) as a second factor',
        'Review active sessions and sign out everywhere',
        'Change your password',
      ]}
      backend="Passkeys and TOTP are owned by mfa-webauthn-service (scaffold); password change is served by identity-service."
    />
  );
}
