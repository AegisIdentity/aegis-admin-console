import type { ReactNode } from 'react';
import { Alert, Card, List } from 'antd';
import { CheckCircleTwoTone } from '@ant-design/icons';
import { PageHeader } from './PageHeader';

/**
 * A consistent, honest page for capabilities whose backend service is scaffolded but not yet
 * feature-complete. Shows what the section will do (so the console reads as a real product) and a
 * clear note on backend status, rather than faking data.
 */
export function FeaturePage({
  title,
  description,
  capabilities,
  backend,
  extra,
}: {
  title: string;
  description: string;
  capabilities: string[];
  backend: string;
  extra?: ReactNode;
}) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <Card style={{ marginBottom: 16 }}>
        <List
          dataSource={capabilities}
          renderItem={(c) => (
            <List.Item>
              <CheckCircleTwoTone twoToneColor="#3b5bdb" style={{ marginRight: 10 }} />
              {c}
            </List.Item>
          )}
        />
      </Card>
      {extra}
      <Alert type="info" showIcon message="Backend status" description={backend} />
    </>
  );
}
