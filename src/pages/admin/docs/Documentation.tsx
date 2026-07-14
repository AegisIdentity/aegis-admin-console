import { useMemo, useState } from 'react';
import { Alert, Button, Card, Collapse, Space, Tabs, Tag, Typography } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../components/PageHeader';
import { config } from '../../../config';
import { API_GROUPS, type ApiGroup, type ApiOperation, type HttpMethod } from './apiSpec';
import { GUIDES, type Guide } from './guides';

const { Text, Paragraph, Title } = Typography;

const METHOD_COLOR: Record<HttpMethod, string> = {
  GET: 'blue',
  POST: 'green',
  PUT: 'orange',
  PATCH: 'geekblue',
  DELETE: 'red',
};

function hostBase(group: ApiGroup): string {
  return group.host === 'issuer' ? config.oidcAuthority : config.apiBase;
}

/** Render a guide step, turning `inline code` spans into <Text code>. */
function renderStep(text: string) {
  const parts = text.split('`');
  return parts.map((part, i) =>
    i % 2 === 1 ? <Text code key={i}>{part}</Text> : <span key={i}>{part}</span>,
  );
}

function OperationRow({ op }: { op: ApiOperation }) {
  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid #f0f2f7' }}>
      <Space align="start" wrap>
        <Tag color={METHOD_COLOR[op.method]} style={{ fontFamily: 'monospace', minWidth: 58, textAlign: 'center' }}>
          {op.method}
        </Tag>
        <Text code style={{ fontSize: 13 }}>{op.path}</Text>
        <Tag>{op.auth}</Tag>
      </Space>
      <Paragraph type="secondary" style={{ margin: '6px 0 0 66px' }}>{op.summary}</Paragraph>
      {(op.request || op.response) && (
        <div style={{ marginLeft: 66, marginTop: 4 }}>
          {op.request && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>Request</Text>
              <pre style={{ background: '#f4f6fb', padding: 10, borderRadius: 6, overflowX: 'auto', fontSize: 12, margin: '2px 0 8px' }}>{op.request}</pre>
            </div>
          )}
          {op.response && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>Response</Text>
              <pre style={{ background: '#f4f6fb', padding: 10, borderRadius: 6, overflowX: 'auto', fontSize: 12, margin: '2px 0 0' }}>{op.response}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ApiReference() {
  const items = API_GROUPS.map((group, i) => ({
    key: String(i),
    label: (
      <Space wrap>
        <Text strong>{group.name}</Text>
        <Tag>{group.service}</Tag>
        <Text type="secondary" style={{ fontSize: 12 }}>{group.operations.length} endpoints</Text>
      </Space>
    ),
    children: (
      <>
        <Paragraph type="secondary">{group.description}</Paragraph>
        <Text type="secondary" style={{ fontSize: 12 }}>Base URL: <Text code copyable>{hostBase(group)}</Text></Text>
        <div style={{ marginTop: 8 }}>
          {group.operations.map((op) => <OperationRow key={op.method + op.path} op={op} />)}
        </div>
      </>
    ),
  }));

  return (
    <>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 12 }} align="start" wrap>
        <Paragraph type="secondary" style={{ maxWidth: 640, marginBottom: 0 }}>
          Every platform endpoint, grouped by service. Management APIs are reached via the edge gateway
          (<Text code>{config.apiBase}</Text>); OAuth and tenant-app endpoints are on the issuer
          (<Text code>{config.oidcAuthority}</Text>).
        </Paragraph>
        <Button icon={<DownloadOutlined />} onClick={downloadOpenApi}>Download OpenAPI 3.0</Button>
      </Space>
      <Collapse items={items} defaultActiveKey={['0']} />
    </>
  );
}

function Guides() {
  return (
    <Space direction="vertical" size={16} style={{ display: 'flex' }}>
      {GUIDES.map((g: Guide) => (
        <Card key={g.id} title={<Space><Text strong>{g.title}</Text><Tag color="blue">{g.tag}</Tag></Space>}>
          <Paragraph type="secondary">{g.intro}</Paragraph>
          {g.console && (
            <Paragraph style={{ marginBottom: 8 }}>
              <Text type="secondary">In this console: </Text><Text code>{g.console}</Text>
            </Paragraph>
          )}
          <ol style={{ paddingLeft: 20, margin: 0 }}>
            {g.steps.map((s, i) => <li key={i} style={{ marginBottom: 6 }}>{renderStep(s)}</li>)}
          </ol>
          {g.note && <Alert type="info" showIcon style={{ marginTop: 12 }} message={g.note} />}
        </Card>
      ))}
    </Space>
  );
}

export function Documentation() {
  const [tab, setTab] = useState('api');
  const guideAnchors = useMemo(() => GUIDES.map((g) => g.title).join(', '), []);

  return (
    <>
      <PageHeader
        title="Documentation"
        description="API reference and configuration guides for every auth mechanism on the platform."
      />
      <Card>
        <Tabs
          activeKey={tab}
          onChange={setTab}
          items={[
            { key: 'api', label: 'API reference', children: <ApiReference /> },
            {
              key: 'guides',
              label: 'Auth mechanism guides',
              children: (
                <>
                  <Title level={5} style={{ marginTop: 0 }}>Configure each mechanism</Title>
                  <Paragraph type="secondary" style={{ fontSize: 12 }}>{guideAnchors}</Paragraph>
                  <Guides />
                </>
              ),
            },
          ]}
        />
      </Card>
    </>
  );
}

/** Generate a downloadable OpenAPI 3.0 document from the same catalog that drives the reference. */
function downloadOpenApi() {
  type Op = { tags: string[]; summary: string; description: string; responses: Record<string, unknown> };
  const paths: Record<string, Record<string, Op>> = {};
  for (const group of API_GROUPS) {
    for (const op of group.operations) {
      const cleanPath = op.path.split('?')[0];
      const entry = (paths[cleanPath] ??= {});
      entry[op.method.toLowerCase()] = {
        tags: [group.name],
        summary: op.summary,
        description: `Auth: ${op.auth}. Host: ${group.host === 'issuer' ? config.oidcAuthority : config.apiBase}.`
          + (op.request ? `\n\nExample request:\n${op.request}` : '')
          + (op.response ? `\n\nExample response:\n${op.response}` : ''),
        responses: { '200': { description: 'OK' } },
      };
    }
  }
  const spec = {
    openapi: '3.0.3',
    info: {
      title: 'Aegis IAM Platform API',
      version: '0.1.0',
      description: 'Distributed multi-tenant IAM platform: OAuth2/OIDC, users, MFA/passkeys, social/SAML federation, SCIM, RBAC, custom domains, and the tenant-app embedded auth API.',
    },
    servers: [
      { url: config.apiBase, description: 'Edge gateway (management APIs)' },
      { url: config.oidcAuthority, description: 'Issuer / authorization-server (OAuth + tenant-app)' },
    ],
    tags: API_GROUPS.map((g) => ({ name: g.name, description: g.description })),
    paths,
  };
  const blob = new Blob([JSON.stringify(spec, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'aegis-openapi.json';
  a.click();
  URL.revokeObjectURL(url);
}
