import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Alert, Button, Card, Form, Input, Result, Typography } from 'antd';
import { UserAddOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { registerApi, type RegisterRequest } from '../api/endpoints';

const { Title, Paragraph, Text } = Typography;

/**
 * Public end-user self-registration: a tenant's customer creates their own account in an existing
 * organization. Succeeds only if that organization has enabled self-service sign-up (Settings), so a
 * closed or unknown org returns the same generic error (no enumeration).
 */
export function Register() {
  const navigate = useNavigate();
  const [done, setDone] = useState<{ tenant: string; username: string } | null>(null);

  const register = useMutation({
    mutationFn: (body: RegisterRequest) => registerApi.register(body),
    onSuccess: (res) => setDone(res),
  });

  return (
    <div className="aegis-signin-wrap">
      <div className="aegis-signin-brandpane">
        <div className="aegis-brand" style={{ fontSize: 22, marginBottom: 28 }}>
          <img src="/shield.svg" width={34} height={34} alt="" />
          Aegis Identity
        </div>
        <Title level={2} style={{ color: '#fff', marginTop: 0 }}>
          Create your account.
        </Title>
        <Paragraph style={{ color: '#c7d0e8', fontSize: 16, maxWidth: 440 }}>
          Register with the organization that invited you. Your account is isolated to that
          organization and secured by Aegis.
        </Paragraph>
      </div>

      <div className="aegis-signin-formpane">
        <Card className="aegis-signin-card" variant="borderless" styles={{ body: { padding: 32 } }}>
          {done ? (
            <Result
              status="success"
              title="Account created"
              subTitle={
                <span>
                  Sign in with <b>Organization</b> <code>{done.tenant}</code> and username{' '}
                  <code>{done.username}</code>.
                </span>
              }
              extra={
                <Button type="primary" onClick={() => navigate('/signin')}>
                  Go to sign in
                </Button>
              }
            />
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <UserAddOutlined style={{ fontSize: 40, color: '#3b5bdb' }} />
                <Title level={3} style={{ marginTop: 12, marginBottom: 4 }}>
                  Sign up
                </Title>
                <Text type="secondary">Create your account in your organization</Text>
              </div>

              {register.isError && (
                <Alert
                  type="error"
                  showIcon
                  style={{ marginBottom: 16 }}
                  message="Could not create your account"
                  description="Self-service sign-up may not be available for that organization, or that username/email is already taken."
                />
              )}

              <Form layout="vertical" onFinish={(v: RegisterRequest) => register.mutate(v)} requiredMark="optional">
                <Form.Item
                  name="tenantSlug"
                  label="Organization ID"
                  extra="The organization that invited you (e.g. acme)."
                  rules={[
                    { required: true },
                    { pattern: /^[a-z0-9][a-z0-9-]{0,62}$/, message: 'Lowercase DNS-safe id (e.g. acme)' },
                  ]}
                >
                  <Input placeholder="acme" />
                </Form.Item>
                <Form.Item name="username" label="Username" rules={[{ required: true }]}>
                  <Input autoComplete="off" placeholder="jane" />
                </Form.Item>
                <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                  <Input autoComplete="off" placeholder="jane@acme.com" />
                </Form.Item>
                <Form.Item name="password" label="Password" rules={[{ required: true, min: 8 }]}>
                  <Input.Password autoComplete="new-password" />
                </Form.Item>
                <Button type="primary" size="large" block htmlType="submit" loading={register.isPending}>
                  Create account
                </Button>
              </Form>

              <Paragraph type="secondary" style={{ textAlign: 'center', marginTop: 18, marginBottom: 0 }}>
                Already have an account? <Link to="/signin">Sign in</Link>
              </Paragraph>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
