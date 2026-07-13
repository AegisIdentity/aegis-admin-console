import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Form, Input, Modal, Select, Table, Tag, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader } from '../../components/PageHeader';
import { appsApi } from '../../api/endpoints';
import type { Application } from '../../api/types';

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
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (s: Application['status']) => <Tag color={s === 'ACTIVE' ? 'green' : 'default'}>{s}</Tag>,
  },
];

export function Applications() {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const apps = useQuery({ queryKey: ['apps'], queryFn: appsApi.list });

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
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ type: 'OIDC' }}
          onFinish={() => {
            message.info('Application registration is wired to admin-api-service (on the roadmap).');
            setOpen(false);
            form.resetFields();
          }}
        >
          <Form.Item name="name" label="App name" rules={[{ required: true }]}>
            <Input placeholder="Acme Portal" />
          </Form.Item>
          <Form.Item name="type" label="Sign-in method" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'OIDC', label: 'OIDC / OAuth2' },
                { value: 'SAML', label: 'SAML 2.0' },
              ]}
            />
          </Form.Item>
          <Form.Item name="redirectUri" label="Redirect URI">
            <Input placeholder="https://app.example.com/login/oauth2/code/aegis" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
