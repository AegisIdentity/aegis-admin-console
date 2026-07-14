import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Card, Checkbox, Form, InputNumber, Space, Switch, Typography, message } from 'antd';
import { PageHeader } from '../../components/PageHeader';
import { authPolicyApi } from '../../api/endpoints';
import type { AuthPolicy } from '../../api/types';

const { Text } = Typography;

const MFA_METHOD_OPTIONS = [
  { label: 'Authenticator app (TOTP)', value: 'TOTP' },
  { label: 'Passkey (WebAuthn / FIDO2)', value: 'WEBAUTHN' },
];

/**
 * Per-tenant authentication policy. Password rules + lockout are enforced by identity-service; MFA
 * requirement and session TTL are stored and surfaced here (runtime enforcement is owned by the MFA /
 * session layer).
 */
export function AuthPolicies() {
  const qc = useQueryClient();
  const [form] = Form.useForm<AuthPolicy>();
  const policy = useQuery({ queryKey: ['auth-policy'], queryFn: authPolicyApi.get });
  const mfaOn = (Form.useWatch('mfaRequired', form) ?? policy.data?.mfaRequired) === true;

  const save = useMutation({
    mutationFn: (body: AuthPolicy) => authPolicyApi.update(body),
    onSuccess: () => {
      message.success('Authentication policy saved');
      void qc.invalidateQueries({ queryKey: ['auth-policy'] });
    },
    onError: () => message.error('Could not save policy'),
  });

  return (
    <>
      <PageHeader title="Authentication Policies" description="Decide how strongly users must prove who they are." />

      {policy.isLoading ? (
        <Card loading />
      ) : (
        <Form<AuthPolicy>
          form={form}
          layout="vertical"
          initialValues={policy.data}
          onFinish={(v) => save.mutate(v)}
        >
          <Card title="Password policy" style={{ marginBottom: 20 }}>
            <Form.Item name="passwordMinLength" label="Minimum length" rules={[{ required: true }]}>
              <InputNumber min={8} max={128} style={{ width: 120 }} />
            </Form.Item>
            <Space size="large" wrap>
              <Form.Item name="passwordRequireUppercase" label="Require uppercase" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item name="passwordRequireLowercase" label="Require lowercase" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item name="passwordRequireDigit" label="Require digit" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item name="passwordRequireSymbol" label="Require symbol" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Space>
          </Card>

          <Card title="Lockout" style={{ marginBottom: 20 }}>
            <Space size="large" wrap>
              <Form.Item name="lockoutThreshold" label="Failed attempts before lock" rules={[{ required: true }]}>
                <InputNumber min={1} max={100} style={{ width: 120 }} />
              </Form.Item>
              <Form.Item name="lockoutDurationMinutes" label="Lock duration (minutes)" rules={[{ required: true }]}>
                <InputNumber min={1} max={1440} style={{ width: 120 }} />
              </Form.Item>
            </Space>
          </Card>

          <Card title="MFA & session" style={{ marginBottom: 20 }}>
            <Alert
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
              message="Enforced at sign-in"
              description="When Require MFA is on, users are challenged for a second factor after their password (or forced to enrol one) before any token is issued. Choose which factor types are accepted below. Session lifetime is stored per-tenant."
            />
            <Space size="large" wrap align="start">
              <Form.Item name="mfaRequired" label="Require MFA" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item name="sessionTtlMinutes" label="Session lifetime (minutes)" rules={[{ required: true }]}>
                <InputNumber min={5} max={1440} style={{ width: 120 }} />
              </Form.Item>
            </Space>
            {mfaOn && (
              <Form.Item
                name="mfaMethods"
                label="Accepted second factors"
                rules={[{ required: true, type: 'array', min: 1, message: 'Pick at least one factor type' }]}
                style={{ marginTop: 8 }}
              >
                <Checkbox.Group options={MFA_METHOD_OPTIONS} />
              </Form.Item>
            )}
          </Card>

          <Space>
            <Button type="primary" htmlType="submit" loading={save.isPending}>Save policy</Button>
            <Text type="secondary">Applies to all password sign-ins in your organization.</Text>
          </Space>
        </Form>
      )}
    </>
  );
}
