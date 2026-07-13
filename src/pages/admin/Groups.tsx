import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Form, Input, List, Modal, Popconfirm, Select, Space, Table, Tag, message } from 'antd';
import { PlusOutlined, TeamOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader } from '../../components/PageHeader';
import { groupsApi, usersApi } from '../../api/endpoints';
import type { CreateGroupRequest, Group } from '../../api/types';

export function Groups() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [membersOf, setMembersOf] = useState<Group | null>(null);
  const [form] = Form.useForm<CreateGroupRequest>();

  const groups = useQuery({ queryKey: ['groups'], queryFn: groupsApi.list });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['groups'] });

  const create = useMutation({
    mutationFn: (b: CreateGroupRequest) => groupsApi.create(b),
    onSuccess: () => {
      message.success('Group created');
      setCreateOpen(false);
      form.resetFields();
      void invalidate();
    },
    onError: () => message.error('Could not create group'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => groupsApi.remove(id),
    onSuccess: () => {
      message.success('Group deleted');
      void invalidate();
    },
    onError: () => message.error('Delete failed'),
  });

  const columns: ColumnsType<Group> = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    {
      title: 'Members',
      dataIndex: 'memberCount',
      key: 'memberCount',
      render: (n: number) => <Tag icon={<TeamOutlined />}>{n}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_t, g) => (
        <Space>
          <Button size="small" onClick={() => setMembersOf(g)}>
            Members
          </Button>
          <Popconfirm title="Delete this group?" okText="Delete" okButtonProps={{ danger: true }}
            onConfirm={() => remove.mutate(g.id)}>
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
        title="Groups"
        description="Organize users; drive access and policy by group membership."
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            Create group
          </Button>
        }
      />
      <Table<Group>
        rowKey="id"
        columns={columns}
        dataSource={groups.data ?? []}
        loading={groups.isLoading}
        locale={{ emptyText: 'No groups yet — create your first one.' }}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="Create group"
        open={createOpen}
        okText="Create"
        confirmLoading={create.isPending}
        onCancel={() => setCreateOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={(v) => create.mutate(v)} requiredMark="optional">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input placeholder="Engineers" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input placeholder="What this group is for" />
          </Form.Item>
        </Form>
      </Modal>

      {membersOf && <MembersModal group={membersOf} onClose={() => setMembersOf(null)} />}
    </>
  );
}

function MembersModal({ group, onClose }: { group: Group; onClose: () => void }) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | undefined>();

  const members = useQuery({ queryKey: ['group-members', group.id], queryFn: () => groupsApi.members(group.id) });
  const allUsers = useQuery({ queryKey: ['users'], queryFn: usersApi.list });
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['group-members', group.id] });
    void qc.invalidateQueries({ queryKey: ['groups'] });
  };

  const add = useMutation({
    mutationFn: (userId: string) => groupsApi.addMember(group.id, userId),
    onSuccess: () => {
      setSelected(undefined);
      refresh();
    },
    onError: () => message.error('Could not add member'),
  });
  const remove = useMutation({
    mutationFn: (userId: string) => groupsApi.removeMember(group.id, userId),
    onSuccess: refresh,
    onError: () => message.error('Could not remove member'),
  });

  const memberIds = new Set((members.data ?? []).map((m) => m.id));
  const candidates = (allUsers.data ?? []).filter((u) => !memberIds.has(u.id));

  return (
    <Modal title={`Members · ${group.name}`} open footer={null} onCancel={onClose} width={520}>
      <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
        <Select
          style={{ width: '100%' }}
          placeholder="Add a user to this group"
          value={selected}
          onChange={setSelected}
          showSearch
          optionFilterProp="label"
          options={candidates.map((u) => ({ value: u.id, label: `${u.username} (${u.email})` }))}
        />
        <Button type="primary" disabled={!selected} loading={add.isPending}
          onClick={() => selected && add.mutate(selected)}>
          Add
        </Button>
      </Space.Compact>
      <List
        loading={members.isLoading}
        dataSource={members.data ?? []}
        locale={{ emptyText: 'No members yet' }}
        renderItem={(u) => (
          <List.Item
            actions={[
              <Button key="rm" size="small" danger type="text" onClick={() => remove.mutate(u.id)}>
                Remove
              </Button>,
            ]}
          >
            <List.Item.Meta title={u.username} description={u.email} />
          </List.Item>
        )}
      />
    </Modal>
  );
}
