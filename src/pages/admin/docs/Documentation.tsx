import { useMemo, useState } from 'react';
import { Alert, Button, Card, Collapse, Segmented, Space, Tabs, Tag, Typography, message } from 'antd';
import { CopyOutlined, DownloadOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../components/PageHeader';
import { config } from '../../../config';
import { useAuth } from '../../../auth/AuthContext';
import { API_GROUPS, type ApiGroup, type ApiOperation, type HttpMethod } from './apiSpec';
import { GUIDES, type Guide } from './guides';
import { LANGS, RECIPES, type Lang, type Recipe } from './codeSamples';

const { Text, Paragraph, Title } = Typography;

const METHOD_COLOR: Record<HttpMethod, string> = {
  GET: 'blue',
  POST: 'green',
  PUT: 'orange',
  PATCH: 'geekblue',
  DELETE: 'red',
};

/**
 * Everything in the docs is customised to the signed-in organization: the tenant slug comes from the
 * admin's token, the issuer is the PER-TENANT issuer through the edge gateway
 * (`<gateway>/<tenant>` — the public front door), and code samples get real URLs + slug-prefixed
 * client ids substituted in.
 */
function useDocsContext() {
  const { tenant } = useAuth();
  const slug = tenant ?? '{tenant}';
  const issuerBase = `${config.apiBase}/${slug}`;
  /** Substitute the render-time placeholders in a sample or path with this org's real values. */
  const subst = (text: string): string =>
    text
      .split('https://ISSUER').join(issuerBase)
      .split('https://GATEWAY').join(config.apiBase)
      .split('{tenant}').join(slug)
      .split('acme-').join(`${slug}-`);
  return { slug, issuerBase, gateway: config.apiBase, subst };
}

function hostBase(group: ApiGroup, issuerBase: string): string {
  return group.host === 'issuer' ? issuerBase : config.apiBase;
}

/** Render a guide step, turning `inline code` spans into <Text code>. */
function renderStep(text: string) {
  const parts = text.split('`');
  return parts.map((part, i) =>
    i % 2 === 1 ? <Text code key={i}>{part}</Text> : <span key={i}>{part}</span>,
  );
}

function OperationRow({ op, subst }: { op: ApiOperation; subst: (s: string) => string }) {
  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid #f0f2f7' }}>
      <Space align="start" wrap>
        <Tag color={METHOD_COLOR[op.method]} style={{ fontFamily: 'monospace', minWidth: 58, textAlign: 'center' }}>
          {op.method}
        </Tag>
        <Text code style={{ fontSize: 13 }}>{subst(op.path)}</Text>
        <Tag>{op.auth}</Tag>
      </Space>
      <Paragraph type="secondary" style={{ margin: '6px 0 0 66px' }}>{op.summary}</Paragraph>
      {(op.request || op.response) && (
        <div style={{ marginLeft: 66, marginTop: 4 }}>
          {op.request && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>Request</Text>
              <pre style={{ background: '#f4f6fb', padding: 10, borderRadius: 6, overflowX: 'auto', fontSize: 12, margin: '2px 0 8px' }}>{subst(op.request)}</pre>
            </div>
          )}
          {op.response && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>Response</Text>
              <pre style={{ background: '#f4f6fb', padding: 10, borderRadius: 6, overflowX: 'auto', fontSize: 12, margin: '2px 0 0' }}>{subst(op.response)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ApiReference() {
  const { slug, issuerBase, gateway, subst } = useDocsContext();
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
        <Text type="secondary" style={{ fontSize: 12 }}>Base URL: <Text code copyable>{hostBase(group, issuerBase)}</Text></Text>
        <div style={{ marginTop: 8 }}>
          {group.operations.map((op) => <OperationRow key={op.method + op.path} op={op} subst={subst} />)}
        </div>
      </>
    ),
  }));

  return (
    <>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 12 }} align="start" wrap>
        <Paragraph type="secondary" style={{ maxWidth: 640, marginBottom: 0 }}>
          Every endpoint, customised for <Text strong>{slug}</Text> and reached through the platform
          gateway. Your organization&apos;s OAuth/OIDC issuer is <Text code>{issuerBase}</Text>;
          management and tenant-app APIs are on the gateway root (<Text code>{gateway}</Text>).
        </Paragraph>
        <Button icon={<DownloadOutlined />} onClick={() => downloadOpenApi(issuerBase)}>Download OpenAPI 3.0</Button>
      </Space>
      <Collapse items={items} defaultActiveKey={['0']} />
    </>
  );
}

function Guides() {
  const { subst } = useDocsContext();
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
            {g.steps.map((s, i) => <li key={i} style={{ marginBottom: 6 }}>{renderStep(subst(s))}</li>)}
          </ol>
          {g.note && <Alert type="info" showIcon style={{ marginTop: 12 }} message={subst(g.note)} />}
        </Card>
      ))}
    </Space>
  );
}

function CodeRecipes() {
  const { slug, issuerBase, gateway, subst } = useDocsContext();
  const [lang, setLang] = useState<Lang>('TypeScript');
  const categories = ['Built-in (hosted)', 'Embedded (your app runs it)', 'Backend & APIs'] as const;

  return (
    <>
      <Space style={{ marginBottom: 12 }} align="center" wrap>
        <Text type="secondary">Language:</Text>
        <Segmented options={[...LANGS]} value={lang} onChange={(v) => setLang(v as Lang)} />
        <Text type="secondary" style={{ fontSize: 12 }}>
          Pre-filled for <Text strong>{slug}</Text>: issuer <Text code>{issuerBase}</Text>, gateway <Text code>{gateway}</Text>.
        </Text>
      </Space>
      {categories.map((cat) => {
        const recipes = RECIPES.filter((r: Recipe) => r.category === cat);
        if (recipes.length === 0) return null;
        return (
          <div key={cat} style={{ marginBottom: 20 }}>
            <Title level={5}>{cat}</Title>
            <Space direction="vertical" size={16} style={{ display: 'flex' }}>
              {recipes.map((r) => {
                const code = r.code[lang];
                return (
                  <Card key={r.id} size="small"
                    title={<Space wrap><Text strong>{r.title}</Text><Tag color="blue">{r.audience}</Tag></Space>}>
                    <Paragraph type="secondary">{r.intro}</Paragraph>
                    {code ? (
                      <div style={{ position: 'relative' }}>
                        <Button size="small" icon={<CopyOutlined />} style={{ position: 'absolute', right: 8, top: 8, zIndex: 1 }}
                          onClick={() => { void navigator.clipboard.writeText(subst(code)); message.success('Copied'); }}>Copy</Button>
                        <pre style={{ background: '#0d1117', color: '#e6edf3', padding: 14, borderRadius: 8, overflowX: 'auto', fontSize: 12.5, lineHeight: 1.55, margin: 0 }}>{subst(code)}</pre>
                      </div>
                    ) : (
                      <Alert type="info" showIcon message="This step runs client-side — see the TypeScript sample." />
                    )}
                  </Card>
                );
              })}
            </Space>
          </div>
        );
      })}
    </>
  );
}

export function Documentation() {
  const { slug } = useDocsContext();
  const [tab, setTab] = useState('api');
  const guideAnchors = useMemo(() => GUIDES.map((g) => g.title).join(', '), []);

  return (
    <>
      <PageHeader
        title="Documentation"
        description={`API reference, configuration guides and code samples — customised for your organization (${slug}).`}
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
            {
              key: 'code',
              label: 'Code samples',
              children: (
                <>
                  <Paragraph type="secondary" style={{ marginTop: 0 }}>
                    Copy-paste integration recipes in Python, Java, Go and TypeScript — for a tenant&apos;s own
                    web/mobile app, SaaS backend, or a 3rd-party app, and for using the platform&apos;s built-in
                    per-tenant login. Pick a language; URLs and client ids are pre-filled for your organization.
                  </Paragraph>
                  <CodeRecipes />
                </>
              ),
            },
          ]}
        />
      </Card>
    </>
  );
}

/** Generate a downloadable OpenAPI 3.0 document from the same catalog that drives the reference,
 *  with this organization's per-tenant issuer (through the gateway) as a server. */
function downloadOpenApi(issuerBase: string) {
  type Op = { tags: string[]; summary: string; description: string; responses: Record<string, unknown> };
  const paths: Record<string, Record<string, Op>> = {};
  for (const group of API_GROUPS) {
    for (const op of group.operations) {
      const cleanPath = op.path.split('?')[0];
      const entry = (paths[cleanPath] ??= {});
      entry[op.method.toLowerCase()] = {
        tags: [group.name],
        summary: op.summary,
        description: `Auth: ${op.auth}. Host: ${group.host === 'issuer' ? issuerBase : config.apiBase}.`
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
      { url: config.apiBase, description: 'Edge gateway (management + tenant-app APIs)' },
      { url: issuerBase, description: 'Your organization\'s OAuth/OIDC issuer (per-tenant, via the gateway)' },
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
