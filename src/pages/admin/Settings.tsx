import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, List, Space, Switch, Tag, Typography, message } from 'antd';
import { PageHeader } from '../../components/PageHeader';
import { signupPolicyApi } from '../../api/endpoints';

const { Text, Paragraph } = Typography;

/**
 * Organization settings. Self-service sign-up is a live, tenant-scoped toggle (identity-service);
 * the remaining items name their owning service and are on the roadmap.
 */
export function Settings() {
  const qc = useQueryClient();
  const policy = useQuery({ queryKey: ['signup-policy'], queryFn: signupPolicyApi.get });

  const setEnabled = useMutation({
    mutationFn: (enabled: boolean) => signupPolicyApi.set(enabled),
    onSuccess: (res) => {
      message.success(res.signupEnabled ? 'Self-service sign-up enabled' : 'Self-service sign-up disabled');
      void qc.invalidateQueries({ queryKey: ['signup-policy'] });
    },
    onError: () => message.error('Could not update sign-up policy'),
  });

  const roadmap = [
    'Organization profile and custom domains (verified CNAME) — tenant-service',
    'Admin roles (RBAC) and admin API tokens — admin-api-service (scaffold)',
    'SCIM provisioning connectors (inbound / outbound) — scim-provisioning-service (scaffold)',
  ];

  return (
    <>
      <PageHeader title="Settings" description="Organization, self-service sign-up, domains, and API access." />

      <Card style={{ marginBottom: 24 }}>
        <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
          <div style={{ maxWidth: 640 }}>
            <Text strong>Self-service sign-up</Text>
            <Paragraph type="secondary" style={{ marginBottom: 0, marginTop: 4 }}>
              Let your customers create their own accounts in this organization via the public sign-up
              page (<code>/register</code>) or your app calling <code>POST /api/v1/signup</code>. When off,
              only admins and your backend (via the management API) can create users. Off by default.
            </Paragraph>
          </div>
          <Switch
            checked={policy.data?.signupEnabled ?? false}
            loading={policy.isLoading || setEnabled.isPending}
            onChange={(v) => setEnabled.mutate(v)}
            checkedChildren="On"
            unCheckedChildren="Off"
          />
        </Space>
      </Card>

      <Card title="On the roadmap">
        <List
          dataSource={roadmap}
          renderItem={(item) => (
            <List.Item>
              <Space>
                <Tag>soon</Tag>
                <Text type="secondary">{item}</Text>
              </Space>
            </List.Item>
          )}
        />
      </Card>
    </>
  );
}
