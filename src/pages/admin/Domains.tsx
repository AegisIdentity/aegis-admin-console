import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Card, Descriptions, Form, Input, Popconfirm, Space, Tag, Typography, message } from 'antd';
import { PageHeader } from '../../components/PageHeader';
import { domainsApi } from '../../api/endpoints';
import type { CustomDomain } from '../../api/types';

const { Text, Paragraph } = Typography;

/**
 * Custom sign-in domains: serve the hosted login at the tenant's own host (login.acme.com) for full
 * white-labelling. The tenant adds DNS records to prove ownership; once verified, sign-in can be served
 * on that host. (TLS issuance + ingress routing for the domain are handled at deploy time.)
 */
export function Domains() {
  const qc = useQueryClient();
  const [form] = Form.useForm<{ domain: string }>();
  const domains = useQuery({ queryKey: ['domains'], queryFn: domainsApi.list });
  const [busyId, setBusyId] = useState<string | null>(null);

  const add = useMutation({
    mutationFn: (v: { domain: string }) => domainsApi.add(v.domain),
    onSuccess: () => {
      message.success('Domain added — set the DNS records below, then verify');
      form.resetFields();
      void qc.invalidateQueries({ queryKey: ['domains'] });
    },
    onError: () => message.error('Could not add domain (already added?)'),
  });
  const verify = useMutation({
    mutationFn: (id: string) => domainsApi.verify(id),
    onSuccess: (d) => {
      if (d.status === 'VERIFIED') message.success('Domain verified');
      else message.warning('Not verified yet — check the DNS records');
      void qc.invalidateQueries({ queryKey: ['domains'] });
    },
    onError: () => message.error('DNS records not found yet — verification failed'),
    onSettled: () => setBusyId(null),
  });
  const remove = useMutation({
    mutationFn: (id: string) => domainsApi.remove(id),
    onSuccess: () => {
      message.success('Domain removed');
      void qc.invalidateQueries({ queryKey: ['domains'] });
    },
    onError: () => message.error('Could not remove domain'),
  });

  return (
    <>
      <PageHeader title="Custom domains" description="Serve sign-in on your own domain for full white-labelling." />

      <Card style={{ marginBottom: 24 }} title="Add a domain">
        <Form form={form} layout="inline" onFinish={(v) => add.mutate(v)}>
          <Form.Item name="domain" rules={[{ required: true, message: 'e.g. login.acme.com' }]} style={{ flex: 1, minWidth: 260 }}>
            <Input placeholder="login.acme.com" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={add.isPending}>Add domain</Button>
          </Form.Item>
        </Form>
      </Card>

      <Space direction="vertical" size={16} style={{ display: 'flex' }}>
        {(domains.data ?? []).map((d: CustomDomain) => (
          <Card
            key={d.id}
            title={<Space>{d.domain}<Tag color={d.status === 'VERIFIED' ? 'green' : 'orange'}>{d.status}</Tag></Space>}
            extra={
              <Space>
                {d.status !== 'VERIFIED' && (
                  <Button type="primary" loading={busyId === d.id && verify.isPending}
                    onClick={() => { setBusyId(d.id); verify.mutate(d.id); }}>Verify</Button>
                )}
                <Popconfirm title={`Remove ${d.domain}?`} onConfirm={() => remove.mutate(d.id)} okText="Remove">
                  <Button danger>Remove</Button>
                </Popconfirm>
              </Space>
            }
          >
            {d.status !== 'VERIFIED' && (
              <Alert type="info" showIcon style={{ marginBottom: 12 }}
                message="Add these DNS records at your provider, then click Verify." />
            )}
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label={`CNAME (${d.dnsRecords.cname.host})`}>
                <Text code copyable>{d.dnsRecords.cname.target}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={`TXT (${d.dnsRecords.txt.host})`}>
                <Text code copyable>{d.dnsRecords.txt.value}</Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        ))}
        {(domains.data ?? []).length === 0 && !domains.isLoading && (
          <Paragraph type="secondary">No custom domains yet.</Paragraph>
        )}
      </Space>
    </>
  );
}
