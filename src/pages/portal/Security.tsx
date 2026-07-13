import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  List,
  Popconfirm,
  QRCode,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import { CheckCircleTwoTone, KeyOutlined, MobileOutlined, LockOutlined } from '@ant-design/icons';
import { PageHeader } from '../../components/PageHeader';
import { accountApi, mfaApi } from '../../api/endpoints';
import type { TotpEnrollment } from '../../api/types';
import { createPasskey, isWebAuthnAvailable } from '../../auth/webauthn';

const { Text, Paragraph } = Typography;

/**
 * End-user self-service security: enrol a TOTP authenticator (confirm-before-activate with a QR code),
 * register WebAuthn passkeys, and change the account password. All backed by real services
 * (mfa-webauthn-service, identity-service); every call operates on the signed-in user's own subject.
 */
export function Security() {
  const qc = useQueryClient();
  const factors = useQuery({ queryKey: ['mfa-factors'], queryFn: mfaApi.factors });
  const refresh = () => qc.invalidateQueries({ queryKey: ['mfa-factors'] });

  return (
    <>
      <PageHeader title="Security" description="Manage how you sign in and protect your account." />
      <Space direction="vertical" size={20} style={{ display: 'flex', maxWidth: 720 }}>
        <TotpCard enrolled={factors.data?.totp?.enabled ?? false} loading={factors.isLoading} onChange={refresh} />
        <PasskeyCard passkeys={factors.data?.passkeys ?? []} loading={factors.isLoading} onChange={refresh} />
        <ChangePasswordCard />
      </Space>
    </>
  );
}

function TotpCard({ enrolled, loading, onChange }: { enrolled: boolean; loading: boolean; onChange: () => void }) {
  const [enrollment, setEnrollment] = useState<TotpEnrollment | null>(null);
  const [code, setCode] = useState('');

  const begin = useMutation({
    mutationFn: mfaApi.enrollTotp,
    onSuccess: (e) => setEnrollment(e),
    onError: () => message.error('Could not start TOTP setup'),
  });
  const verify = useMutation({
    mutationFn: (c: string) => mfaApi.verifyTotp(c),
    onSuccess: () => {
      message.success('Authenticator app enabled');
      setEnrollment(null);
      setCode('');
      onChange();
    },
    onError: () => message.error('That code was not valid — try the current one'),
  });
  const remove = useMutation({
    mutationFn: mfaApi.removeTotp,
    onSuccess: () => {
      message.success('Authenticator app removed');
      onChange();
    },
    onError: () => message.error('Could not remove authenticator'),
  });

  return (
    <Card
      loading={loading}
      title={<Space><MobileOutlined /> Authenticator app (TOTP)</Space>}
      extra={enrolled ? <Tag icon={<CheckCircleTwoTone twoToneColor="#0ca678" />} color="success">Enabled</Tag> : null}
    >
      {enrolled ? (
        <Space direction="vertical">
          <Text>A time-based one-time-password app is set up as a second factor.</Text>
          <Popconfirm title="Remove the authenticator app?" onConfirm={() => remove.mutate()} okText="Remove">
            <Button danger loading={remove.isPending}>Remove</Button>
          </Popconfirm>
        </Space>
      ) : enrollment ? (
        <Space direction="vertical" size={16} style={{ display: 'flex' }}>
          <Text>Scan this with Google Authenticator, 1Password, Authy, or similar — then enter the 6-digit code.</Text>
          <Space size={24} wrap align="start">
            <QRCode value={enrollment.otpauthUri} size={168} />
            <Space direction="vertical">
              <Text type="secondary">Or enter the key manually:</Text>
              <Text code copyable>{enrollment.secret}</Text>
            </Space>
          </Space>
          <Space>
            <Input
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              style={{ width: 140, letterSpacing: 4, fontSize: 18, textAlign: 'center' }}
              maxLength={6}
            />
            <Button type="primary" loading={verify.isPending} disabled={code.length !== 6}
              onClick={() => verify.mutate(code)}>Verify &amp; enable</Button>
            <Button onClick={() => setEnrollment(null)}>Cancel</Button>
          </Space>
        </Space>
      ) : (
        <Space direction="vertical">
          <Text type="secondary">Add a one-time-code app as a second factor.</Text>
          <Button type="primary" loading={begin.isPending} onClick={() => begin.mutate()}>Set up authenticator</Button>
        </Space>
      )}
    </Card>
  );
}

function PasskeyCard({
  passkeys,
  loading,
  onChange,
}: {
  passkeys: { id: string; label: string; createdAt: string }[];
  loading: boolean;
  onChange: () => void;
}) {
  const available = isWebAuthnAvailable();

  const register = useMutation({
    mutationFn: async () => {
      const options = await mfaApi.passkeyOptions();
      const attestation = await createPasskey(options);
      const label = window.prompt('Name this passkey', 'My device') ?? 'Passkey';
      return mfaApi.passkeyFinish({ ...attestation, label });
    },
    onSuccess: () => {
      message.success('Passkey registered');
      onChange();
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : 'Passkey registration failed';
      message.error(msg);
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => mfaApi.removePasskey(id),
    onSuccess: () => {
      message.success('Passkey removed');
      onChange();
    },
    onError: () => message.error('Could not remove passkey'),
  });

  return (
    <Card
      loading={loading}
      title={<Space><KeyOutlined /> Passkeys (WebAuthn / FIDO2)</Space>}
      extra={
        <Button type="primary" loading={register.isPending} disabled={!available}
          onClick={() => register.mutate()}>Register a passkey</Button>
      }
    >
      {!available && (
        <Alert type="warning" showIcon style={{ marginBottom: 12 }}
          message="This browser does not expose WebAuthn, so passkeys can't be registered here." />
      )}
      {passkeys.length === 0 ? (
        <Text type="secondary">No passkeys yet. Register one for passwordless, phishing-resistant sign-in.</Text>
      ) : (
        <List
          dataSource={passkeys}
          renderItem={(p) => (
            <List.Item
              actions={[
                <Popconfirm key="rm" title="Remove this passkey?" onConfirm={() => remove.mutate(p.id)} okText="Remove">
                  <Button size="small" danger>Remove</Button>
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                avatar={<KeyOutlined style={{ fontSize: 18 }} />}
                title={p.label}
                description={`Added ${new Date(p.createdAt).toLocaleString()}`}
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  );
}

function ChangePasswordCard() {
  const [form] = Form.useForm();
  const change = useMutation({
    mutationFn: (v: { currentPassword: string; newPassword: string }) =>
      accountApi.changePassword(v.currentPassword, v.newPassword),
    onSuccess: () => {
      message.success('Password changed');
      form.resetFields();
    },
    onError: (e: unknown) => {
      const detail =
        typeof e === 'object' && e !== null && 'response' in e
          ? ((e as { response?: { data?: { detail?: string; error?: string } } }).response?.data?.detail ??
            (e as { response?: { data?: { error?: string } } }).response?.data?.error)
          : undefined;
      message.error(detail ?? 'Could not change password');
    },
  });

  return (
    <Card title={<Space><LockOutlined /> Password</Space>}>
      <Form
        form={form}
        layout="vertical"
        style={{ maxWidth: 360 }}
        onFinish={(v) => change.mutate({ currentPassword: v.currentPassword, newPassword: v.newPassword })}
      >
        <Form.Item name="currentPassword" label="Current password" rules={[{ required: true }]}>
          <Input.Password autoComplete="current-password" />
        </Form.Item>
        <Form.Item name="newPassword" label="New password" rules={[{ required: true, min: 8 }]}>
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          name="confirm"
          label="Confirm new password"
          dependencies={['newPassword']}
          rules={[
            { required: true },
            ({ getFieldValue }) => ({
              validator: (_, value) =>
                !value || getFieldValue('newPassword') === value
                  ? Promise.resolve()
                  : Promise.reject(new Error('Passwords do not match')),
            }),
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={change.isPending}>Change password</Button>
        <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0, fontSize: 12 }}>
          Your new password must satisfy your organization's password policy.
        </Paragraph>
      </Form>
    </Card>
  );
}
