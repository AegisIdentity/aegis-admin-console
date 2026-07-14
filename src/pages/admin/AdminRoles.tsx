import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Form, Input, List, Modal, Popconfirm, Select, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader } from '../../components/PageHeader';
import { rbacApi } from '../../api/endpoints';
import type { AdminAssignment } from '../../api/types';

const { Text, Paragraph } = Typography;

/**
 * Admin RBAC: assign scoped admin roles (least-privilege) instead of everyone being a full admin. The
 * role catalog is fixed built-in roles; assignments are per admin per organization. The signed-in
 * admin's own roles gate what the rest of the console lets them do.
 */
export function AdminRoles() {
  const qc = useQueryClient();
  const [form] = Form.useForm<{ subject: string; roles: string[] }>();
  const [open, setOpen] = useState(false);
  const roles = useQuery({ queryKey: ['admin-roles'], queryFn: rbacApi.roles });
  const admins = useQuery({ queryKey: ['admin-admins'], queryFn: rbacApi.admins });

  const roleOptions = (roles.data ?? []).map((r) => ({ value: r.role, label: r.role.replace(/_/g, ' ') }));

  const save = useMutation({
    mutationFn: (v: { subject: string; roles: string[] }) => rbacApi.setRoles(v.subject, v.roles),
    onSuccess: () => {
      message.success('Admin roles updated');
      setOpen(false);
      form.resetFields();
      void qc.invalidateQueries({ queryKey: ['admin-admins'] });
    },
    onError: () => message.error('Could not update roles'),
  });
  const remove = useMutation({
    mutationFn: (subject: string) => rbacApi.removeAdmin(subject),
    onSuccess: () => {
      message.success('Admin removed');
      void qc.invalidateQueries({ queryKey: ['admin-admins'] });
    },
    onError: () => message.error('Could not remove admin'),
  });

  const columns: ColumnsType<AdminAssignment> = [
    { title: 'Admin', dataIndex: 'subject', key: 'subject' },
    {
      title: 'Roles',
      dataIndex: 'roles',
      key: 'roles',
      render: (rs: string[]) => <Space wrap>{rs.map((r) => <Tag key={r} color="blue">{r.replace(/_/g, ' ')}</Tag>)}</Space>,
    },
    {
      title: '',
      key: 'actions',
      width: 160,
      render: (_, a) => (
        <Space>
          <Button size="small" onClick={() => { form.setFieldsValue(a); setOpen(true); }}>Edit</Button>
          <Popconfirm title={`Remove admin ${a.subject}?`} onConfirm={() => remove.mutate(a.subject)} okText="Remove">
            <Button size="small" danger>Remove</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Admins & Roles" description="Grant scoped admin access instead of full admin to everyone." />
      <Card
        style={{ marginBottom: 24 }}
        title="Administrators"
        extra={<Button type="primary" onClick={() => { form.resetFields(); setOpen(true); }}>Assign roles</Button>}
      >
        <Table<AdminAssignment> rowKey="subject" columns={columns} dataSource={admins.data ?? []}
          loading={admins.isLoading} locale={{ emptyText: 'No scoped admins yet — everyone with admin access is a full admin.' }} />
      </Card>

      <Card title="Role catalog" loading={roles.isLoading}>
        <List
          dataSource={roles.data ?? []}
          renderItem={(r) => (
            <List.Item>
              <List.Item.Meta
                title={<Tag color="blue">{r.role.replace(/_/g, ' ')}</Tag>}
                description={<Space wrap>{r.permissions.map((p) => <Text code key={p}>{p}</Text>)}</Space>}
              />
            </List.Item>
          )}
        />
      </Card>

      <Modal title="Assign admin roles" open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()}
        confirmLoading={save.isPending} okText="Save">
        <Form form={form} layout="vertical" onFinish={(v) => save.mutate(v)}>
          <Paragraph type="secondary">Enter the admin's username and pick the roles they should have.</Paragraph>
          <Form.Item name="subject" label="Admin username" rules={[{ required: true }]}>
            <Input placeholder="jane.admin" />
          </Form.Item>
          <Form.Item name="roles" label="Roles" rules={[{ required: true, type: 'array', min: 1 }]}>
            <Select mode="multiple" options={roleOptions} placeholder="Pick one or more roles" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
