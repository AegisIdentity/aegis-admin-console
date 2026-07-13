import { useQuery } from '@tanstack/react-query';
import { Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader } from '../../components/PageHeader';
import { logsApi } from '../../api/endpoints';
import type { SystemLogEvent } from '../../api/types';

const outcomeColor: Record<SystemLogEvent['outcome'], string> = {
  SUCCESS: 'green',
  FAILURE: 'red',
  DENIED: 'orange',
};

const columns: ColumnsType<SystemLogEvent> = [
  { title: 'Time', dataIndex: 'at', key: 'at', width: 200 },
  { title: 'Type', dataIndex: 'type', key: 'type' },
  { title: 'Action', dataIndex: 'action', key: 'action' },
  {
    title: 'Outcome',
    dataIndex: 'outcome',
    key: 'outcome',
    render: (o: SystemLogEvent['outcome']) => <Tag color={outcomeColor[o]}>{o}</Tag>,
  },
  { title: 'Actor', dataIndex: 'actor', key: 'actor' },
];

export function SystemLog() {
  const logs = useQuery({ queryKey: ['system-log'], queryFn: logsApi.list });

  return (
    <>
      <PageHeader
        title="System Log"
        description="Immutable audit trail of authentication and administrative events (streamed from the audit backbone)."
      />
      <Table<SystemLogEvent>
        rowKey="id"
        columns={columns}
        dataSource={logs.data ?? []}
        loading={logs.isLoading}
        locale={{ emptyText: 'No events yet — the audit stream populates this as activity occurs.' }}
        pagination={{ pageSize: 15 }}
      />
    </>
  );
}
