import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, ColorPicker, Form, Input, Typography, message } from 'antd';
import { PageHeader } from '../../components/PageHeader';
import { brandingApi } from '../../api/endpoints';
import type { Branding as BrandingModel } from '../../api/types';

const { Title, Paragraph, Text } = Typography;

/**
 * Per-tenant sign-in branding. Applied by the authorization-server's login page (product name,
 * heading, subtitle, and primary color — the color via a same-origin theme stylesheet so it stays
 * within the login page's strict CSP). A custom logo needs asset hosting and is a documented follow-up.
 */
export function Branding() {
  const qc = useQueryClient();
  const [form] = Form.useForm<BrandingModel>();
  const branding = useQuery({ queryKey: ['branding'], queryFn: brandingApi.get });
  const color = Form.useWatch('primaryColor', form) ?? branding.data?.primaryColor ?? '#3b5bdb';
  const heading = Form.useWatch('signInHeading', form) ?? branding.data?.signInHeading;
  const product = Form.useWatch('productName', form) ?? branding.data?.productName;
  const subtitle = Form.useWatch('signInSubtitle', form) ?? branding.data?.signInSubtitle;

  const save = useMutation({
    mutationFn: (body: BrandingModel) => brandingApi.update(body),
    onSuccess: () => {
      message.success('Branding saved — it appears on your sign-in page');
      void qc.invalidateQueries({ queryKey: ['branding'] });
    },
    onError: () => message.error('Could not save branding'),
  });

  return (
    <>
      <PageHeader title="Branding" description="Make the sign-in experience yours." />

      {branding.isLoading ? (
        <Card loading />
      ) : (
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <Card title="Sign-in branding" style={{ flex: '1 1 380px' }}>
            <Form<BrandingModel> form={form} layout="vertical" initialValues={branding.data}
              onFinish={(v) => save.mutate(v)}>
              <Form.Item name="productName" label="Product name" rules={[{ required: true, max: 64 }]}>
                <Input placeholder="Acme SSO" />
              </Form.Item>
              <Form.Item name="signInHeading" label="Sign-in heading" rules={[{ required: true, max: 160 }]}>
                <Input placeholder="Welcome to Acme" />
              </Form.Item>
              <Form.Item name="signInSubtitle" label="Sign-in subtitle" rules={[{ required: true, max: 280 }]}>
                <Input.TextArea rows={2} placeholder="Sign in to continue to your apps." />
              </Form.Item>
              <Form.Item name="primaryColor" label="Primary color"
                getValueFromEvent={(c) => (typeof c === 'string' ? c : c.toHexString())}
                rules={[{ required: true, pattern: /^#[0-9a-fA-F]{6}$/, message: 'Hex color like #3b5bdb' }]}>
                <ColorPicker disabledAlpha format="hex" showText />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={save.isPending}>Save branding</Button>
            </Form>
          </Card>

          <Card title="Preview" style={{ flex: '1 1 320px' }}>
            <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #eef1f6' }}>
              <div style={{ background: color, color: '#fff', padding: 24 }}>
                <Text style={{ color: '#fff', fontWeight: 700 }}>{product}</Text>
                <Title level={4} style={{ color: '#fff', marginTop: 12, marginBottom: 0 }}>{heading}</Title>
              </div>
              <div style={{ padding: 24 }}>
                <Paragraph type="secondary" style={{ marginBottom: 16 }}>{subtitle}</Paragraph>
                <div style={{ background: color, color: '#fff', textAlign: 'center', padding: '10px 0',
                  borderRadius: 8, fontWeight: 600 }}>Sign in</div>
              </div>
            </div>
            <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0, fontSize: 12 }}>
              Shown on your organization's hosted sign-in page.
            </Paragraph>
          </Card>
        </div>
      )}
    </>
  );
}
