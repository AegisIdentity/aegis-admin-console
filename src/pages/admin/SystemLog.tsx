import { useQuery } from '@tanstack/react-query';
import { Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader } from '../../components/PageHeader';
import { logsApi } from '../../api/endpoints';
import type { SystemLogEvent } from '../../api/types';

/** Colour an event by what its action implies — failures/denials red, destructive amber, else green. */
function actionColor(action: string): string {
  const a = action.toUpperCase();
  if (a.includes('FAILURE') || a.includes('DENIED') || a.includes('LOCKED')) return 'red';
  if (a.includes('DELETED') || a.includes('DISABLED') || a.includes('REMOVED')) return 'orange';
  return 'green';
}

const columns: ColumnsType<SystemLogEvent> = [
  {
    title: 'Time',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 210,
    render: (t: string) => new Date(t).toLocaleString(),
  },
  {
    title: 'Action',
    dataIndex: 'action',
    key: 'action',
    render: (a: string) => <Tag color={actionColor(a)}>{a}</Tag>,
  },
  { title: 'Actor', dataIndex: 'actor', key: 'actor' },
  { title: 'Target', dataIndex: 'target', key: 'target', render: (t?: string | null) => t ?? '—' },
  { title: 'Detail', dataIndex: 'detail', key: 'detail', render: (d?: string | null) => d ?? '—' },
];

export function SystemLog() {
  const logs = useQuery({ queryKey: ['system-log'], queryFn: logsApi.list });

  return (
    <>
      <PageHeader
        title="System Log"
        description="Audit trail of authentication and administrative events for your organization (newest first)."
      />
      <Table<SystemLogEvent>
        rowKey="id"
        columns={columns}
        dataSource={logs.data ?? []}
        loading={logs.isLoading}
        locale={{ emptyText: 'No events yet — this populates as activity occurs.' }}
        pagination={{ pageSize: 15 }}
      />
    </>
  );
}
