import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Form, Input, Modal, Popconfirm, Select, Switch, Table, Tag, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader } from '../../components/PageHeader';
import { idpApi } from '../../api/endpoints';
import type { CreateProviderRequest, IdentityProvider, ProviderCatalogEntry } from '../../api/types';

const PROTOCOL_COLOR: Record<string, string> = { OIDC: 'blue', OAUTH2: 'geekblue', SAML: 'purple' };

interface AddForm {
  providerKey: string;
  alias: string;
  displayName?: string;
  clientId?: string;
  clientSecret?: string;
  issuerUri?: string;
  providerDirectory?: string;
  samlMetadataUrl?: string;
  scopes?: string;
}

export function IdentityProviders() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<AddForm>();
  const providerKey = Form.useWatch('providerKey', form);

  const providers = useQuery({ queryKey: ['idps'], queryFn: idpApi.list });
  const catalog = useQuery({ queryKey: ['idp-catalog'], queryFn: idpApi.catalog });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['idps'] });

  const selected: ProviderCatalogEntry | undefined = (catalog.data ?? []).find((c) => c.key === providerKey);
  const needs = (f: string) => selected?.requiredFields.includes(f) ?? false;
  const isSaml = selected?.protocol === 'SAML';

  const create = useMutation({
    mutationFn: (body: CreateProviderRequest) => idpApi.create(body),
    onSuccess: () => {
      message.success('Identity provider added');
      setOpen(false);
      form.resetFields();
      void invalidate();
    },
    onError: () => message.error('Could not add provider — check the required fields and credentials.'),
  });

  const toggle = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => idpApi.update(id, { enabled }),
    onSuccess: () => void invalidate(),
    onError: () => message.error('Could not update provider'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => idpApi.remove(id),
    onSuccess: () => {
      message.success('Provider removed');
      void invalidate();
    },
    onError: () => message.error('Delete failed'),
  });

  const onFinish = (v: AddForm) => {
    const body: CreateProviderRequest = {
      providerKey: v.providerKey,
      alias: v.alias,
      displayName: v.displayName || undefined,
      clientId: v.clientId || undefined,
      clientSecret: v.clientSecret || undefined,
      issuerUri: v.issuerUri || undefined,
      providerDirectory: v.providerDirectory || undefined,
      samlMetadataUrl: v.samlMetadataUrl || undefined,
      scopes: v.scopes || undefined,
    };
    create.mutate(body);
  };

  const columns: ColumnsType<IdentityProvider> = [
    { title: 'Name', dataIndex: 'displayName', key: 'displayName' },
    { title: 'Provider', dataIndex: 'providerKey', key: 'providerKey', render: (k: string) => <Tag>{k}</Tag> },
    {
      title: 'Protocol',
      dataIndex: 'protocol',
      key: 'protocol',
      render: (p: string) => <Tag color={PROTOCOL_COLOR[p] ?? 'default'}>{p}</Tag>,
    },
    { title: 'Alias', dataIndex: 'alias', key: 'alias', render: (a: string) => <code>{a}</code> },
    {
      title: 'Enabled',
      key: 'enabled',
      render: (_t, p) => (
        <Switch
          checked={p.enabled}
          loading={toggle.isPending}
          onChange={(enabled) => toggle.mutate({ id: p.id, enabled })}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_t, p) => (
        <Popconfirm title="Remove this provider?" okText="Remove" okButtonProps={{ danger: true }}
          onConfirm={() => remove.mutate(p.id)}>
          <Button size="small" danger type="text">Remove</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Identity Providers"
        description="Let your users sign in with an external provider. Add and configure social, OIDC, and SAML providers for your organization."
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
            Add provider
          </Button>
        }
      />
      <Table<IdentityProvider>
        rowKey="id"
        columns={columns}
        dataSource={providers.data ?? []}
        loading={providers.isLoading}
        locale={{ emptyText: 'No identity providers yet — add Google, Entra, Apple, GitHub, OIDC, or SAML.' }}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="Add identity provider"
        open={open}
        okText="Add"
        confirmLoading={create.isPending}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={onFinish} requiredMark="optional">
          <Form.Item name="providerKey" label="Provider" rules={[{ required: true }]}>
            <Select
              placeholder="Choose a provider"
              loading={catalog.isLoading}
              options={(catalog.data ?? []).map((c) => ({ value: c.key, label: c.displayName }))}
              onChange={() => {
                if (selected?.defaultScopes) form.setFieldValue('scopes', undefined);
              }}
            />
          </Form.Item>

          {selected && (
            <>
              {selected.notes && (
                <Alert type="info" showIcon style={{ marginBottom: 16 }} message={selected.notes} />
              )}
              <Form.Item name="displayName" label="Display name" extra="Shown on the sign-in button. Defaults to the provider name.">
                <Input placeholder={selected.displayName} />
              </Form.Item>
              <Form.Item
                name="alias"
                label="Alias"
                extra="Lowercase, DNS-safe. Identifies this provider in the login flow."
                rules={[
                  { required: true },
                  { pattern: /^[a-z0-9][a-z0-9-]{0,62}$/, message: 'Lowercase DNS-safe slug (e.g. google, corp-okta)' },
                ]}
              >
                <Input placeholder={selected.key.toLowerCase()} />
              </Form.Item>

              {needs('providerDirectory') && (
                <Form.Item name="providerDirectory" label="Entra directory (tenant) id" rules={[{ required: true }]}>
                  <Input placeholder="00000000-0000-0000-0000-000000000000 or 'common'" />
                </Form.Item>
              )}
              {needs('issuerUri') && (
                <Form.Item name="issuerUri" label="Issuer URL" rules={[{ required: true, type: 'url' }]}>
                  <Input placeholder="https://idp.example.com" />
                </Form.Item>
              )}
              {needs('samlMetadataUrl') && (
                <Form.Item name="samlMetadataUrl" label="IdP metadata URL" rules={[{ required: true, type: 'url' }]}>
                  <Input placeholder="https://idp.example.com/saml/metadata" />
                </Form.Item>
              )}

              {!isSaml && (
                <>
                  <Form.Item name="clientId" label="Client ID" rules={[{ required: true }]}>
                    <Input autoComplete="off" placeholder="Client / application id from the provider" />
                  </Form.Item>
                  <Form.Item name="clientSecret" label="Client secret" rules={[{ required: true }]}
                    extra="Stored securely and never shown again.">
                    <Input.Password autoComplete="new-password" />
                  </Form.Item>
                  <Form.Item name="scopes" label="Scopes" extra={`Defaults to: ${selected.defaultScopes ?? '—'}`}>
                    <Input placeholder={selected.defaultScopes} />
                  </Form.Item>
                </>
              )}
            </>
          )}
        </Form>
      </Modal>
    </>
  );
}
