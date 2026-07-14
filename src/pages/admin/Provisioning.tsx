import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Card, Form, Input, Modal, Popconfirm, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader } from '../../components/PageHeader';
import { provisioningApi } from '../../api/endpoints';
import { config } from '../../config';
import type { ScimConnector, ScimConnectorCreated } from '../../api/types';

const { Text, Paragraph } = Typography;

/**
 * Inbound SCIM 2.0 provisioning: an upstream IdP (Entra, Okta, Workday) automatically pushes users into
 * this organization. Each connector has a bearer token the upstream is configured with; the token is
 * shown once at creation and stored only as a hash.
 */
export function Provisioning() {
  const qc = useQueryClient();
  const [form] = Form.useForm<{ name: string }>();
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<ScimConnectorCreated | null>(null);
  const connectors = useQuery({ queryKey: ['scim-connectors'], queryFn: provisioningApi.connectors });

  const scimBase = `${config.apiBase}/scim/v2`;

  const add = useMutation({
    mutationFn: (v: { name: string }) => provisioningApi.createConnector(v.name),
    onSuccess: (res) => {
      setOpen(false);
      form.resetFields();
      setCreated(res);
      void qc.invalidateQueries({ queryKey: ['scim-connectors'] });
    },
    onError: () => message.error('Could not create connector'),
  });
  const remove = useMutation({
    mutationFn: (id: string) => provisioningApi.removeConnector(id),
    onSuccess: () => {
      message.success('Connector removed');
      void qc.invalidateQueries({ queryKey: ['scim-connectors'] });
    },
    onError: () => message.error('Could not remove connector'),
  });

  const columns: ColumnsType<ScimConnector> = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Status', dataIndex: 'enabled', key: 'enabled', render: (e: boolean) => <Tag color={e ? 'green' : 'default'}>{e ? 'Enabled' : 'Disabled'}</Tag> },
    { title: 'Created', dataIndex: 'createdAt', key: 'createdAt', render: (t: string) => new Date(t).toLocaleString() },
    {
      title: '',
      key: 'actions',
      width: 100,
      render: (_, c) => (
        <Popconfirm title="Remove this connector? The upstream will stop provisioning." onConfirm={() => remove.mutate(c.id)} okText="Remove">
          <Button size="small" danger>Remove</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Provisioning (SCIM)" description="Let an upstream IdP automatically create and deprovision users here." />
      <Card
        title="Inbound SCIM connectors"
        extra={<Button type="primary" onClick={() => setOpen(true)}>New connector</Button>}
      >
        <Paragraph type="secondary">
          Configure the upstream IdP with the SCIM base URL <Text code copyable>{scimBase}</Text> and the
          bearer token from a connector. Users pushed in are created in this organization; deactivations
          deprovision them.
        </Paragraph>
        <Table<ScimConnector> rowKey="id" columns={columns} dataSource={connectors.data ?? []}
          loading={connectors.isLoading} locale={{ emptyText: 'No connectors yet.' }} />
      </Card>

      <Modal title="New SCIM connector" open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()}
        confirmLoading={add.isPending} okText="Create">
        <Form form={form} layout="vertical" onFinish={(v) => add.mutate(v)}>
          <Form.Item name="name" label="Connector name" rules={[{ required: true }]}>
            <Input placeholder="Entra ID" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Connector created" open={!!created} onCancel={() => setCreated(null)}
        footer={<Button type="primary" onClick={() => setCreated(null)}>Done</Button>}>
        <Alert type="warning" showIcon style={{ marginBottom: 16 }}
          message="Copy this bearer token now — it won't be shown again." />
        <Space direction="vertical" style={{ width: '100%' }}>
          <div><Text type="secondary">SCIM base URL</Text><br /><Text code copyable>{scimBase}</Text></div>
          <div><Text type="secondary">Bearer token</Text><br /><Text code copyable>{created?.token}</Text></div>
        </Space>
      </Modal>
    </>
  );
}
