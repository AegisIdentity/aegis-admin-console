import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Form, Input, Modal, Table, Tag, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader } from '../../components/PageHeader';
import { usersApi } from '../../api/endpoints';
import type { CreateUserRequest, User } from '../../api/types';

const statusColor: Record<User['status'], string> = {
  ACTIVE: 'green',
  DISABLED: 'default',
  LOCKED: 'red',
};

const columns: ColumnsType<User> = [
  { title: 'Username', dataIndex: 'username', key: 'username' },
  { title: 'Email', dataIndex: 'email', key: 'email' },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (s: User['status']) => <Tag color={statusColor[s]}>{s}</Tag>,
  },
];

export function Users() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<CreateUserRequest>();

  const users = useQuery({ queryKey: ['users'], queryFn: usersApi.list });

  const create = useMutation({
    mutationFn: (body: CreateUserRequest) => usersApi.create(body),
    onSuccess: () => {
      message.success('User created');
      setOpen(false);
      form.resetFields();
      void qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => message.error('Could not create user (is the identity-service reachable?)'),
  });

  return (
    <>
      <PageHeader
        title="Users"
        description="People in your organization's directory."
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
            Add user
          </Button>
        }
      />
      <Table<User>
        rowKey="id"
        columns={columns}
        dataSource={users.data ?? []}
        loading={users.isLoading}
        locale={{ emptyText: 'No users yet — add your first one.' }}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="Add user"
        open={open}
        okText="Create"
        confirmLoading={create.isPending}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={(v) => create.mutate(v)} requiredMark="optional">
          <Form.Item name="username" label="Username" rules={[{ required: true }]}>
            <Input autoComplete="off" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input autoComplete="off" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Temporary password"
            rules={[{ required: true, min: 8 }]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
