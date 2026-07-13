import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Card, Form, InputNumber, Space, Switch, Typography, message } from 'antd';
import { PageHeader } from '../../components/PageHeader';
import { authPolicyApi } from '../../api/endpoints';
import type { AuthPolicy } from '../../api/types';

const { Text } = Typography;

/**
 * Per-tenant authentication policy. Password rules + lockout are enforced by identity-service; MFA
 * requirement and session TTL are stored and surfaced here (runtime enforcement is owned by the MFA /
 * session layer).
 */
export function AuthPolicies() {
  const qc = useQueryClient();
  const [form] = Form.useForm<AuthPolicy>();
  const policy = useQuery({ queryKey: ['auth-policy'], queryFn: authPolicyApi.get });

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
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              message="Stored now, enforced next"
              description="MFA requirement and session lifetime are saved per-tenant here; runtime enforcement is owned by the MFA service (WebAuthn/TOTP) and the session layer."
            />
            <Space size="large" wrap>
              <Form.Item name="mfaRequired" label="Require MFA" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item name="sessionTtlMinutes" label="Session lifetime (minutes)" rules={[{ required: true }]}>
                <InputNumber min={5} max={1440} style={{ width: 120 }} />
              </Form.Item>
            </Space>
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
