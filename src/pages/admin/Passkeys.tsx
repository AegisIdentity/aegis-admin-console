import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader } from '../../components/PageHeader';
import { passkeyAdminApi } from '../../api/endpoints';
import type { WebAuthnAuditEvent, WebAuthnRpConfig } from '../../api/types';

const { Text, Paragraph, Title } = Typography;

const AUDIT_COLOR: Record<WebAuthnAuditEvent['action'], string> = {
  PASSKEY_REGISTERED: 'blue',
  PASSKEY_AUTHENTICATED: 'green',
  PASSKEY_REMOVED: 'orange',
  PASSKEY_ASSERT_FAILED: 'red',
};

const auditColumns: ColumnsType<WebAuthnAuditEvent> = [
  { title: 'Time', dataIndex: 'at', key: 'at', width: 200, render: (t: string) => new Date(t).toLocaleString() },
  {
    title: 'Event',
    dataIndex: 'action',
    key: 'action',
    render: (a: WebAuthnAuditEvent['action']) => <Tag color={AUDIT_COLOR[a]}>{a.replace('PASSKEY_', '')}</Tag>,
  },
  { title: 'User', dataIndex: 'subject', key: 'subject', render: (s?: string | null) => s ?? '—' },
  {
    title: 'Credential',
    dataIndex: 'credentialId',
    key: 'credentialId',
    render: (c?: string | null) => (c ? <Text code>{c.slice(0, 12)}…</Text> : '—'),
  },
  { title: 'Authenticator', dataIndex: 'aaguid', key: 'aaguid', render: (a?: string | null) => a ?? '—' },
];

/**
 * Per-tenant passkey (WebAuthn) settings for the tenant's OWN apps, plus a passkey audit trail. The RP
 * config (domain / origins / policy) is what a tenant's web or mobile app binds passkeys to; the Aegis
 * hosted login continues to use the platform default. Mobile apps additionally need the association
 * files below served on the RP domain.
 */
export function Passkeys() {
  const qc = useQueryClient();
  const [form] = Form.useForm<WebAuthnRpConfig>();
  const config = useQuery({ queryKey: ['webauthn-config'], queryFn: passkeyAdminApi.getConfig });
  const audit = useQuery({ queryKey: ['webauthn-audit'], queryFn: passkeyAdminApi.audit });
  const rpId = Form.useWatch('rpId', form) ?? config.data?.rpId ?? 'your-domain.com';

  const save = useMutation({
    mutationFn: (body: WebAuthnRpConfig) => passkeyAdminApi.updateConfig(body),
    onSuccess: () => {
      message.success('Passkey configuration saved');
      void qc.invalidateQueries({ queryKey: ['webauthn-config'] });
    },
    onError: (e: unknown) => {
      const detail =
        typeof e === 'object' && e !== null && 'response' in e
          ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      message.error(detail ?? 'Could not save configuration');
    },
  });

  const aasa = JSON.stringify({ webcredentials: { apps: ['TEAMID.com.your.bundleid'] } }, null, 2);
  const assetlinks = JSON.stringify(
    [
      {
        relation: ['delegate_permission/common.get_login_creds'],
        target: {
          namespace: 'android_app',
          package_name: 'com.your.app',
          sha256_cert_fingerprints: ['AA:BB:CC:…'],
        },
      },
    ],
    null,
    2,
  );

  return (
    <>
      <PageHeader
        title="Passkeys (WebAuthn)"
        description="Configure passkeys for your own web and mobile apps, and audit passkey activity."
      />

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 20 }}
        message="Two ways to use passkeys"
        description={
          <>
            The simplest path is to send users to the Aegis hosted login (branded), where passkeys already
            work — no config needed. Configure the Relying Party below only if your <b>own</b> app runs the
            WebAuthn ceremony itself (embedded), binding passkeys to your domain.
          </>
        }
      />

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <Card title="Relying Party configuration" style={{ flex: '1 1 420px' }} loading={config.isLoading}>
          <Form<WebAuthnRpConfig> form={form} layout="vertical" initialValues={config.data}
            onFinish={(v) => save.mutate(v)}>
            <Form.Item name="rpId" label="RP ID (your registrable domain)"
              rules={[{ required: true, message: 'e.g. acme.com' }]}
              extra="The domain passkeys are bound to. Must be a registrable suffix of your app origins.">
              <Input placeholder="acme.com" />
            </Form.Item>
            <Form.Item name="rpName" label="Display name" rules={[{ required: true }]}>
              <Input placeholder="Acme" />
            </Form.Item>
            <Form.Item name="origins" label="Allowed origins"
              extra="Your web origins (https://app.acme.com) and Android facet IDs (android:apk-key-hash:…).">
              <Select mode="tags" placeholder="https://app.acme.com" tokenSeparators={[',', ' ']} open={false} />
            </Form.Item>
            <Space size="large" wrap>
              <Form.Item name="userVerification" label="User verification">
                <Select style={{ width: 150 }} options={['preferred', 'required', 'discouraged'].map((v) => ({ value: v, label: v }))} />
              </Form.Item>
              <Form.Item name="authenticatorAttachment" label="Authenticator">
                <Select style={{ width: 160 }} options={['any', 'platform', 'cross-platform'].map((v) => ({ value: v, label: v }))} />
              </Form.Item>
            </Space>
            <Space size="large" wrap>
              <Form.Item name="residentKey" label="Resident key">
                <Select style={{ width: 150 }} options={['preferred', 'required', 'discouraged'].map((v) => ({ value: v, label: v }))} />
              </Form.Item>
              <Form.Item name="attestation" label="Attestation">
                <Select style={{ width: 150 }} options={['none', 'indirect', 'direct'].map((v) => ({ value: v, label: v }))} />
              </Form.Item>
              <Form.Item name="enabled" label="Enabled" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Space>
            <Button type="primary" htmlType="submit" loading={save.isPending}>Save configuration</Button>
          </Form>
        </Card>

        <Card title="Mobile setup" style={{ flex: '1 1 380px' }}>
          <Paragraph type="secondary">
            For iOS/Android passkeys, host these association files over HTTPS on <Text code>{rpId}</Text> and
            add the matching entitlement/asset link in your app.
          </Paragraph>
          <Title level={5} style={{ marginBottom: 4 }}>iOS — /.well-known/apple-app-site-association</Title>
          <pre style={{ background: '#f4f6fb', padding: 12, borderRadius: 8, overflowX: 'auto', fontSize: 12 }}>{aasa}</pre>
          <Title level={5} style={{ marginBottom: 4 }}>Android — /.well-known/assetlinks.json</Title>
          <pre style={{ background: '#f4f6fb', padding: 12, borderRadius: 8, overflowX: 'auto', fontSize: 12 }}>{assetlinks}</pre>
        </Card>
      </div>

      <Card title="Recent passkey activity" style={{ marginTop: 24 }}>
        <Table<WebAuthnAuditEvent>
          rowKey="id"
          size="small"
          columns={auditColumns}
          dataSource={audit.data ?? []}
          loading={audit.isLoading}
          locale={{ emptyText: 'No passkey events yet.' }}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </>
  );
}
