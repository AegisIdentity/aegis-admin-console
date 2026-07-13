import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader } from '../../components/PageHeader';
import { appsApi } from '../../api/endpoints';
import type { Application } from '../../api/types';

interface RegisterForm {
  name: string;
  type: 'OIDC' | 'SAML';
  redirectUri: string;
}

export function Applications() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<RegisterForm>();

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

  const remove = useMutation({
    mutationFn: (id: string) => appsApi.remove(id),
    onSuccess: () => {
      message.success('Application deleted');
      void invalidate();
    },
    onError: () => message.error('Delete failed'),
  });

  const onFinish = (v: RegisterForm) => {
    if (v.type === 'SAML') {
      message.info('SAML app registration is served by saml-idp-service (coming soon).');
      return;
    }
    create.mutate({ name: v.name, redirectUri: v.redirectUri });
  };

  const columns: ColumnsType<Application> = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Client ID', dataIndex: 'clientId', key: 'clientId' },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (t: Application['type']) => <Tag color={t === 'OIDC' ? 'blue' : 'purple'}>{t}</Tag>,
    },
    {
      title: 'Grants',
      dataIndex: 'grantTypes',
      key: 'grantTypes',
      render: (g: string[]) => (g ?? []).map((x) => <Tag key={x}>{x}</Tag>),
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
        description="OIDC and SAML app integrations that trust your organization for sign-in."
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
        confirmLoading={create.isPending}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" initialValues={{ type: 'OIDC' }} onFinish={onFinish}
          requiredMark="optional">
          <Form.Item name="name" label="App name" rules={[{ required: true }]}>
            <Input placeholder="Acme Portal" />
          </Form.Item>
          <Form.Item name="type" label="Sign-in method" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'OIDC', label: 'OIDC / OAuth2 (authorization_code + PKCE)' },
                { value: 'SAML', label: 'SAML 2.0' },
              ]}
            />
          </Form.Item>
          <Form.Item name="redirectUri" label="Redirect URI" rules={[{ required: true, type: 'url' }]}>
            <Input placeholder="https://app.example.com/login/oauth2/code/aegis" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
