import { FeaturePage } from '../../components/FeaturePage';

export function Branding() {
  return (
    <FeaturePage
      title="Branding"
      description="Make the sign-in experience yours."
      capabilities={[
        'Logo, colors, and custom domain for the sign-in page',
        'Custom email templates',
        'Per-tenant themed sign-in widget (see the branded sign-in page)',
      ]}
      backend="Branding config is stored in tenant-service; asset storage targets S3 / Azure Blob (ARCHITECTURE.md §4.5)."
    />
  );
}
