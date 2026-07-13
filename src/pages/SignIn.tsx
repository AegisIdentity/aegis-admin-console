import { Button, Card, Typography } from 'antd';
import { LoginOutlined, SafetyCertificateTwoTone } from '@ant-design/icons';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const { Title, Paragraph, Text } = Typography;

/**
 * Branded, themeable sign-in page. The actual credential entry (password, social, passkey, MFA)
 * happens on the authorization-server; this page kicks off the OIDC `authorization_code`+PKCE flow.
 * Per-tenant logo/colors/copy would be driven by tenant branding config.
 */
export function SignIn() {
  const { isAuthenticated, isLoading, login } = useAuth();

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="aegis-signin-wrap">
      <div className="aegis-signin-brandpane">
        <div className="aegis-brand" style={{ fontSize: 22, marginBottom: 28 }}>
          <img src="/shield.svg" width={34} height={34} alt="" />
          Aegis Identity
        </div>
        <Title level={2} style={{ color: '#fff', marginTop: 0 }}>
          One secure front door for every app.
        </Title>
        <Paragraph style={{ color: '#c7d0e8', fontSize: 16, maxWidth: 440 }}>
          Sign in once and Aegis handles password, passkey, MFA, social, and SAML — for your whole
          organization, on standards you can trust.
        </Paragraph>
      </div>

      <div className="aegis-signin-formpane">
        <Card className="aegis-signin-card" variant="borderless" styles={{ body: { padding: 32 } }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <SafetyCertificateTwoTone twoToneColor="#3b5bdb" style={{ fontSize: 40 }} />
            <Title level={3} style={{ marginTop: 12, marginBottom: 4 }}>
              Sign in
            </Title>
            <Text type="secondary">Continue to the Aegis console</Text>
          </div>
          <Button
            type="primary"
            size="large"
            block
            icon={<LoginOutlined />}
            loading={isLoading}
            onClick={login}
          >
            Sign in with Aegis
          </Button>
          <Paragraph type="secondary" style={{ textAlign: 'center', marginTop: 18, marginBottom: 0 }}>
            New organization? <Link to="/signup">Create one</Link>
          </Paragraph>
          <Paragraph type="secondary" style={{ textAlign: 'center', marginTop: 8, marginBottom: 0, fontSize: 12 }}>
            Protected by OAuth 2.1 · authorization_code + PKCE
          </Paragraph>
        </Card>
      </div>
    </div>
  );
}
