import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader } from '../../components/PageHeader';
import { appsApi, GRANTABLE_SERVICE_SCOPES } from '../../api/endpoints';
import type { Application, ServiceApplicationCreated } from '../../api/types';

type AppKind = 'OIDC' | 'SERVICE' | 'SAML';

interface RegisterForm {
  name: string;
  kind: AppKind;
  redirectUri?: string;
  scopes?: string[];
}

const TYPE_COLOR: Record<Application['type'], string> = { OIDC: 'blue', SERVICE: 'gold', SAML: 'geekblue' };

export function Applications() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<RegisterForm>();
  const kind = Form.useWatch('kind', form);
  const [secret, setSecret] = useState<ServiceApplicationCreated | null>(null);

  const apps = useQuery({ queryKey: ['apps'], queryFn: appsApi.list });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['apps'] });

  const create = useMutation({
    mutationFn: (body: { name: string; redirectUri: string }) => appsApi.create(body),
    onSuccess: () => {
      message.success('Application registered');
      setOpen(false);
      form.resetFields();
      void invalidate();
    },
    onError: () => message.error('Could not register application'),
  });

  const createService = useMutation({
    mutationFn: (body: { name: string; scopes: string[] }) => appsApi.createService(body),
    onSuccess: (created) => {
      setOpen(false);
      form.resetFields();
      setSecret(created); // reveal the one-time secret
      void invalidate();
    },
    onError: () => message.error('Could not create service application'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => appsApi.remove(id),
    onSuccess: () => {
      message.success('Application deleted');
      void invalidate();
    },
    onError: () => message.error('Delete failed'),
  });

  const onFinish = (v: RegisterForm) => {
    if (v.kind === 'SAML') {
      message.info('SAML app registration is served by saml-idp-service (coming soon).');
      return;
    }
    if (v.kind === 'SERVICE') {
      createService.mutate({ name: v.name, scopes: v.scopes ?? [] });
      return;
    }
    create.mutate({ name: v.name, redirectUri: v.redirectUri ?? '' });
  };

  const columns: ColumnsType<Application> = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Client ID', dataIndex: 'clientId', key: 'clientId', render: (c: string) => <code>{c}</code> },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (t: Application['type']) => <Tag color={TYPE_COLOR[t] ?? 'default'}>{t}</Tag>,
    },
    {
      title: 'Grants / scopes',
      key: 'grants',
      render: (_t, a) =>
        a.type === 'SERVICE'
          ? (a.scopes ?? []).map((s) => <Tag key={s}>{s}</Tag>)
          : (a.grantTypes ?? []).map((g) => <Tag key={g}>{g}</Tag>),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_t, a) => (
        <Space>
          <Popconfirm title="Delete this application?" okText="Delete" okButtonProps={{ danger: true }}
            onConfirm={() => remove.mutate(a.id)}>
            <Button size="small" danger type="text">
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Applications"
        description="OIDC/SAML apps that trust your org for sign-in, plus service (M2M) apps whose credentials call the management APIs."
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
            Register application
          </Button>
        }
      />
      <Table<Application>
        rowKey="id"
        columns={columns}
        dataSource={apps.data ?? []}
        loading={apps.isLoading}
        locale={{ emptyText: 'No applications yet — register your first integration.' }}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="Register application"
        open={open}
        okText="Create"
        confirmLoading={create.isPending || createService.isPending}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" initialValues={{ kind: 'OIDC' }} onFinish={onFinish}
          requiredMark="optional">
          <Form.Item name="name" label="App name" rules={[{ required: true }]}>
            <Input placeholder="Acme Portal" />
          </Form.Item>
          <Form.Item name="kind" label="Application type" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'OIDC', label: 'OIDC / OAuth2 — browser or mobile login (authorization_code + PKCE)' },
                { value: 'SERVICE', label: 'Service (M2M) — backend calls the management APIs (client_credentials)' },
                { value: 'SAML', label: 'SAML 2.0' },
              ]}
            />
          </Form.Item>
          {kind === 'OIDC' && (
            <Form.Item name="redirectUri" label="Redirect URI" rules={[{ required: true, type: 'url' }]}>
              <Input placeholder="https://app.example.com/login/oauth2/code/aegis" />
            </Form.Item>
          )}
          {kind === 'SERVICE' && (
            <Form.Item
              name="scopes"
              label="API scopes"
              tooltip="What this service credential is allowed to do against the management APIs."
              rules={[{ required: true, message: 'Select at least one scope' }]}
            >
              <Select
                mode="multiple"
                placeholder="e.g. identity:users:write"
                options={GRANTABLE_SERVICE_SCOPES.map((s) => ({ value: s, label: s }))}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>

      <Modal
        title="Service application created"
        open={secret !== null}
        onOk={() => setSecret(null)}
        onCancel={() => setSecret(null)}
        okText="Done"
        cancelButtonProps={{ style: { display: 'none' } }}
      >
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Copy the client secret now"
          description="This is the only time the secret is shown. Store it securely — it cannot be retrieved again."
        />
        {secret && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div>
              <Typography.Text type="secondary">Client ID</Typography.Text>
              <br />
              <Typography.Text copyable code>{secret.clientId}</Typography.Text>
            </div>
            <div>
              <Typography.Text type="secondary">Client secret</Typography.Text>
              <br />
              <Typography.Text copyable code>{secret.clientSecret}</Typography.Text>
            </div>
            <div>
              <Typography.Text type="secondary">Scopes</Typography.Text>
              <br />
              {secret.scopes.map((s) => (
                <Tag key={s}>{s}</Tag>
              ))}
            </div>
            <Typography.Text type="secondary">
              Use these with the <code>client_credentials</code> grant at{' '}
              <code>/oauth2/token</code> to obtain a token for the management APIs.
            </Typography.Text>
          </Space>
        )}
      </Modal>
    </>
  );
}
