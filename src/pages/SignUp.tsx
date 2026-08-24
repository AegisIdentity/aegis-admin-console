import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Alert, Button, Card, Form, Input, Result, Typography } from 'antd';
import { SafetyCertificateTwoTone } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { onboardingApi, type OnboardRequest } from '../api/endpoints';
import { config } from '../config';

const { Title, Paragraph, Text } = Typography;

/**
 * Turn a failed signup into something actionable.
 *
 * This used to be a single hardcoded "that organization id may already be taken", which masked every
 * other failure mode. It was actively misleading: onboarding answers a neutral 202 even for an
 * existing org (M-core-2, so the endpoint is not a tenant-existence oracle), so a duplicate id is in
 * fact the one thing that never lands here. The failure that did land here was a blocked request —
 * when the console's CSP `connect-src` omits the gateway origin the browser refuses the call before
 * sending it, so there is no response, no CORS message and no server-side log line to go on.
 */
function signupErrorDescription(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return `Could not reach the API at ${config.apiBase}. Check that the edge gateway is up, and that this console was built with that origin in its Content-Security-Policy connect-src — the browser console will show a CSP or CORS error if it was blocked.`;
    }
    const body = error.response.data as { detail?: string; message?: string; error?: string } | undefined;
    const detail = body?.detail ?? body?.message ?? body?.error;
    return detail ?? `The server rejected the request (HTTP ${error.response.status}).`;
  }
  return 'Unexpected error while creating the organization. Please try again.';
}

/** Public onboarding page: create a new organization and its first admin, then sign in. */
export function SignUp() {
  const navigate = useNavigate();
  const [done, setDone] = useState<{ tenant: string; adminUsername: string } | null>(null);

  const signup = useMutation({
    mutationFn: (body: OnboardRequest) => onboardingApi.signup(body),
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
          Onboard your organization in seconds.
        </Title>
        <Paragraph style={{ color: '#c7d0e8', fontSize: 16, maxWidth: 440 }}>
          Create your org and its first admin. You'll then manage users, groups, apps, and policies —
          fully isolated to your organization.
        </Paragraph>
      </div>

      <div className="aegis-signin-formpane">
        <Card className="aegis-signin-card" variant="borderless" styles={{ body: { padding: 32 } }}>
          {done ? (
            <Result
              status="success"
              title="Organization created"
              subTitle={
                <span>
                  Sign in with <b>Organization</b> <code>{done.tenant}</code>, username{' '}
                  <code>{done.adminUsername}</code>, and the password you just set.
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
                <SafetyCertificateTwoTone twoToneColor="#3b5bdb" style={{ fontSize: 40 }} />
                <Title level={3} style={{ marginTop: 12, marginBottom: 4 }}>
                  Create your organization
                </Title>
                <Text type="secondary">Start managing identity for your team</Text>
              </div>

              {signup.isError && (
                <Alert
                  type="error"
                  showIcon
                  style={{ marginBottom: 16 }}
                  message="Could not create organization"
                  description={signupErrorDescription(signup.error)}
                />
              )}

              <Form layout="vertical" onFinish={(v: OnboardRequest) => signup.mutate(v)} requiredMark="optional">
                <Form.Item name="organizationName" label="Organization name" rules={[{ required: true }]}>
                  <Input placeholder="Acme Inc" />
                </Form.Item>
                <Form.Item
                  name="tenantSlug"
                  label="Organization ID"
                  extra="Lowercase letters, digits, hyphens. You'll enter this as your Organization at sign-in."
                  rules={[
                    { required: true },
                    { pattern: /^[a-z0-9][a-z0-9-]{0,62}$/, message: 'Lowercase DNS-safe id (e.g. acme)' },
                  ]}
                >
                  <Input placeholder="acme" />
                </Form.Item>
                <Form.Item name="adminUsername" label="Admin username" rules={[{ required: true }]}>
                  <Input autoComplete="off" placeholder="admin" />
                </Form.Item>
                <Form.Item name="adminEmail" label="Admin email" rules={[{ required: true, type: 'email' }]}>
                  <Input autoComplete="off" placeholder="admin@acme.com" />
                </Form.Item>
                <Form.Item name="adminPassword" label="Admin password" rules={[{ required: true, min: 8 }]}>
                  <Input.Password autoComplete="new-password" />
                </Form.Item>
                <Button type="primary" size="large" block htmlType="submit" loading={signup.isPending}>
                  Create organization
                </Button>
              </Form>

              <Paragraph type="secondary" style={{ textAlign: 'center', marginTop: 18, marginBottom: 0 }}>
                Already have an org? <Link to="/signin">Sign in</Link>
              </Paragraph>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
