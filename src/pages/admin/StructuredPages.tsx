import { FeaturePage } from '../../components/FeaturePage';

export function IdentityProviders() {
  return (
    <FeaturePage
      title="Identity Providers"
      description="Let your users sign in with an external identity provider."
      capabilities={[
        'Social login: Google, Microsoft, Apple, GitHub, Facebook',
        'Corporate federation: inbound SAML 2.0 and OIDC',
        'Just-in-time provisioning and account linking into your directory',
        'Per-tenant provider configuration (client id/secret, metadata)',
      ]}
      backend="Owned by social-broker-service (scaffold). Inbound SAML/OIDC brokering + social sign-in are the next build-out."
    />
  );
}

export function AuthPolicies() {
  return (
    <FeaturePage
      title="Authentication Policies"
      description="Decide how strongly users must prove who they are."
      capabilities={[
        'Password policy (Argon2id parameters, length, rotation)',
        'MFA: WebAuthn passkeys and TOTP, required or step-up',
        'Sign-on rules by app, group, network, and risk',
        'Session lifetime and token TTLs per tenant',
      ]}
      backend="Password + lockout are enforced today by identity-service; MFA orchestration is owned by mfa-webauthn-service (scaffold)."
    />
  );
}

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
