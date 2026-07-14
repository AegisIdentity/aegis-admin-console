/**
 * The platform API catalog that powers the in-console API Reference. Kept as structured data (not free
 * text) so the same source renders the Swagger-style browser AND exports a downloadable OpenAPI 3.0 spec.
 * Every operation lists its host, auth requirement, and a request/response example.
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Which host serves a group: the edge gateway (management APIs) or the issuer/AS (OAuth + tenant-app). */
export type ApiHost = 'gateway' | 'issuer';

export interface ApiOperation {
  method: HttpMethod;
  path: string;
  summary: string;
  /** Human-readable auth requirement, e.g. "Bearer + SCOPE_tenant:admin", "Public", "Connector token". */
  auth: string;
  request?: string;
  response?: string;
}

export interface ApiGroup {
  name: string;
  service: string;
  host: ApiHost;
  description: string;
  operations: ApiOperation[];
}

export const API_GROUPS: ApiGroup[] = [
  {
    name: 'OAuth 2.1 / OIDC',
    service: 'authorization-server',
    host: 'issuer',
    description:
      'Standards endpoints your web/mobile apps use for login (authorization_code + PKCE) and machine-to-machine (client_credentials). Add ?idp_hint=<alias> to /oauth2/authorize to deep-link straight to a social provider.',
    operations: [
      { method: 'GET', path: '/.well-known/openid-configuration', auth: 'Public', summary: 'OIDC discovery document (endpoints, issuer, jwks_uri).' },
      { method: 'GET', path: '/oauth2/authorize', auth: 'Public (browser redirect)', summary: 'Start authorization_code + PKCE. Params: response_type=code, client_id, redirect_uri, scope, code_challenge, code_challenge_method=S256, state, [idp_hint].' },
      { method: 'POST', path: '/oauth2/token', auth: 'Client (PKCE or client_secret)', summary: 'Exchange a code, refresh a token, or get an M2M token.', request: 'grant_type=authorization_code&code=...&redirect_uri=...&client_id=...&code_verifier=...', response: '{ "access_token": "...", "id_token": "...", "refresh_token": "...", "token_type": "Bearer", "expires_in": 600 }' },
      { method: 'GET', path: '/oauth2/jwks', auth: 'Public', summary: 'JSON Web Key Set used to verify tokens (per-tenant keys).' },
      { method: 'GET', path: '/userinfo', auth: 'Bearer', summary: 'OIDC UserInfo for the signed-in user.' },
    ],
  },
  {
    name: 'Tenant-app embedded auth',
    service: 'authorization-server',
    host: 'issuer',
    description:
      'For a tenant\'s OWN web/mobile app to run passkey / native-social login itself and receive Aegis tokens. Permissive CORS; the app runs the ceremony, gets a single-use PKCE interaction_code, then swaps it for tokens.',
    operations: [
      { method: 'POST', path: '/api/v1/webauthn/register/options', auth: 'Bearer (the signed-in user)', summary: 'Creation options to enrol a passkey bound to the tenant\'s own rpId.' },
      { method: 'POST', path: '/api/v1/webauthn/register/finish', auth: 'Bearer (the signed-in user)', summary: 'Verify + store the passkey attestation.', request: '{ "attestationObject": "b64url", "clientDataJSON": "b64url", "label": "My iPhone" }' },
      { method: 'POST', path: '/api/v1/webauthn/login/options', auth: 'Public', summary: 'Assertion options (challenge, rpId) for passwordless login.', request: '{ "clientId": "acme-mobile" }' },
      { method: 'POST', path: '/api/v1/webauthn/login/finish', auth: 'Public', summary: 'Verify the assertion → returns an interaction_code.', request: '{ "clientId": "acme-mobile", "codeChallenge": "b64url(S256(verifier))", "challengeId": "...", "credentialId": "...", "authenticatorData": "...", "clientDataJSON": "...", "signature": "...", "userHandle": "..." }', response: '{ "interaction_code": "..." }' },
      { method: 'POST', path: '/api/v1/social/native', auth: 'Public', summary: 'Exchange a native-SDK provider id_token (Google/Apple) → interaction_code. Verifies signature/issuer/audience + requires a verified email.', request: '{ "clientId": "acme-mobile", "provider": "google", "idToken": "<provider id_token>", "codeChallenge": "..." }', response: '{ "interaction_code": "..." }' },
      { method: 'POST', path: '/api/v1/oauth/interaction/token', auth: 'Public (PKCE)', summary: 'Swap an interaction_code for Aegis tokens.', request: '{ "clientId": "acme-mobile", "interaction_code": "...", "code_verifier": "..." }', response: '{ "access_token": "...", "id_token": "...", "token_type": "Bearer", "expires_in": 600, "scope": "openid profile" }' },
    ],
  },
  {
    name: 'Users & Groups',
    service: 'identity-service',
    host: 'gateway',
    description: 'The tenant directory. Users and groups are tenant-scoped from the caller\'s token.',
    operations: [
      { method: 'GET', path: '/api/v1/users', auth: 'Bearer + SCOPE_identity:users:read', summary: 'List users in the organization.' },
      { method: 'POST', path: '/api/v1/users', auth: 'Bearer + SCOPE_identity:users:write', summary: 'Create a user (password validated against the org policy).', request: '{ "username": "jane", "email": "jane@acme.com", "password": "..." }' },
      { method: 'POST', path: '/api/v1/users/{id}/disable', auth: 'Bearer + SCOPE_identity:users:write', summary: 'Deactivate a user.' },
      { method: 'POST', path: '/api/v1/users/me/password', auth: 'Bearer (self)', summary: 'The signed-in user changes their own password.', request: '{ "currentPassword": "...", "newPassword": "..." }' },
      { method: 'GET', path: '/api/v1/groups', auth: 'Bearer + SCOPE_identity:groups:read', summary: 'List groups.' },
      { method: 'POST', path: '/api/v1/signup', auth: 'Public', summary: 'End-user self-registration (only if the org enabled it).' },
      { method: 'POST', path: '/api/v1/onboarding', auth: 'Public', summary: 'Bootstrap a brand-new organization + its first admin.' },
    ],
  },
  {
    name: 'Authentication policy',
    service: 'identity-service',
    host: 'gateway',
    description: 'Per-tenant password rules, lockout, and MFA requirement (which factor types are accepted).',
    operations: [
      { method: 'GET', path: '/api/v1/auth-policy', auth: 'Bearer + SCOPE_tenant:admin', summary: 'Read the effective policy.' },
      { method: 'PUT', path: '/api/v1/auth-policy', auth: 'Bearer + SCOPE_tenant:admin', summary: 'Update password rules, lockout, MFA requirement + accepted methods, session TTL.', request: '{ "passwordMinLength": 10, "passwordRequireDigit": true, "lockoutThreshold": 5, "mfaRequired": true, "mfaMethods": ["TOTP","WEBAUTHN"], "sessionTtlMinutes": 60 }' },
    ],
  },
  {
    name: 'MFA & Passkeys',
    service: 'mfa-webauthn-service',
    host: 'gateway',
    description: 'Self-service TOTP + WebAuthn factor management, plus per-tenant passkey RP config and a passkey audit trail.',
    operations: [
      { method: 'GET', path: '/api/v1/mfa/factors', auth: 'Bearer (self)', summary: 'The caller\'s enrolled factors (TOTP + passkeys).' },
      { method: 'POST', path: '/api/v1/mfa/totp/enroll', auth: 'Bearer (self)', summary: 'Start TOTP enrolment → secret + otpauth URI (render as QR).', response: '{ "secret": "BASE32", "otpauthUri": "otpauth://totp/..." }' },
      { method: 'POST', path: '/api/v1/mfa/totp/verify', auth: 'Bearer (self)', summary: 'Confirm the first code → enables the factor.', request: '{ "code": "123456" }' },
      { method: 'POST', path: '/api/v1/mfa/webauthn/register/options', auth: 'Bearer (self)', summary: 'Hosted passkey enrolment options (Aegis rpId).' },
      { method: 'POST', path: '/api/v1/mfa/webauthn/register/finish', auth: 'Bearer (self)', summary: 'Store the passkey.' },
      { method: 'GET', path: '/api/v1/mfa/webauthn/config', auth: 'Bearer + SCOPE_tenant:admin', summary: 'Per-tenant WebAuthn RP config (rpId, origins, policy).' },
      { method: 'PUT', path: '/api/v1/mfa/webauthn/config', auth: 'Bearer + SCOPE_tenant:admin', summary: 'Set the tenant\'s own RP for embedded apps.', request: '{ "rpId": "acme.com", "rpName": "Acme", "origins": ["https://app.acme.com"], "userVerification": "required", "residentKey": "required", "attestation": "none", "enabled": true }' },
      { method: 'GET', path: '/api/v1/mfa/webauthn/audit', auth: 'Bearer + SCOPE_tenant:admin', summary: 'Passkey events (registered / authenticated / removed / failed).' },
    ],
  },
  {
    name: 'Identity Providers (social / OIDC / SAML)',
    service: 'social-broker-service',
    host: 'gateway',
    description: 'Per-tenant federated login providers. Aegis brokers the whole flow; your apps just receive Aegis tokens.',
    operations: [
      { method: 'GET', path: '/api/v1/identity-providers/catalog', auth: 'Bearer + SCOPE_idp:admin', summary: 'Supported provider presets (Google, Entra, Apple, GitHub, generic OIDC, SAML).' },
      { method: 'GET', path: '/api/v1/identity-providers', auth: 'Bearer + SCOPE_idp:admin', summary: 'List the org\'s configured providers.' },
      { method: 'POST', path: '/api/v1/identity-providers', auth: 'Bearer + SCOPE_idp:admin', summary: 'Add a provider (client id/secret; secret is write-only).', request: '{ "providerKey": "GOOGLE", "alias": "google", "displayName": "Google", "clientId": "...", "clientSecret": "...", "scopes": "openid email profile" }' },
      { method: 'DELETE', path: '/api/v1/identity-providers/{id}', auth: 'Bearer + SCOPE_idp:admin', summary: 'Remove a provider.' },
    ],
  },
  {
    name: 'Applications (OAuth clients)',
    service: 'authorization-server',
    host: 'gateway',
    description: 'Register the OAuth clients your apps and backends use — user-facing (PKCE) or machine-to-machine.',
    operations: [
      { method: 'GET', path: '/api/v1/applications', auth: 'Bearer + SCOPE_applications:admin', summary: 'List registered applications.' },
      { method: 'POST', path: '/api/v1/applications', auth: 'Bearer + SCOPE_applications:admin', summary: 'Register a user-facing OAuth app (authorization_code + PKCE).', request: '{ "name": "Acme Web", "redirectUri": "https://app.acme.com/callback" }' },
      { method: 'POST', path: '/api/v1/applications/service', auth: 'Bearer + SCOPE_applications:admin', summary: 'Create a machine-to-machine credential (client_credentials). Secret shown once.', request: '{ "name": "Acme Backend", "scopes": ["identity:users:read"] }' },
    ],
  },
  {
    name: 'Branding',
    service: 'identity-service',
    host: 'gateway',
    description: 'Per-tenant sign-in branding (product name, headings, primary color) applied to the hosted login page.',
    operations: [
      { method: 'GET', path: '/api/v1/branding/{tenant}', auth: 'Public', summary: 'Public branding for a tenant (used by the login page).' },
      { method: 'PUT', path: '/api/v1/branding', auth: 'Bearer + SCOPE_tenant:admin', summary: 'Update your org\'s sign-in branding.' },
    ],
  },
  {
    name: 'Custom domains',
    service: 'tenant-service',
    host: 'gateway',
    description: 'White-label sign-in host (login.acme.com). Add a domain, publish DNS records, verify.',
    operations: [
      { method: 'GET', path: '/api/v1/domains', auth: 'Bearer + SCOPE_tenant:admin', summary: 'List domains + their DNS records + status.' },
      { method: 'POST', path: '/api/v1/domains', auth: 'Bearer + SCOPE_tenant:admin', summary: 'Add a domain (returns the CNAME + TXT records to publish).', request: '{ "domain": "login.acme.com" }' },
      { method: 'POST', path: '/api/v1/domains/{id}/verify', auth: 'Bearer + SCOPE_tenant:admin', summary: 'Verify ownership via the DNS TXT record.' },
    ],
  },
  {
    name: 'Admin roles (RBAC)',
    service: 'admin-api-service',
    host: 'gateway',
    description: 'Scoped admin access: assign built-in roles instead of full admin to everyone.',
    operations: [
      { method: 'GET', path: '/api/v1/admin/roles', auth: 'Bearer', summary: 'The role catalog + each role\'s permissions.' },
      { method: 'GET', path: '/api/v1/admin/admins', auth: 'Bearer + SCOPE_tenant:admin', summary: 'Admins and their assigned roles.' },
      { method: 'PUT', path: '/api/v1/admin/admins/{subject}', auth: 'Bearer + SCOPE_tenant:admin', summary: 'Assign roles to an admin.', request: '{ "roles": ["USER_ADMIN","HELP_DESK"] }' },
      { method: 'GET', path: '/api/v1/admin/me', auth: 'Bearer', summary: 'The caller\'s effective roles + permissions (for UI gating).' },
    ],
  },
  {
    name: 'SCIM 2.0 provisioning',
    service: 'scim-provisioning-service',
    host: 'gateway',
    description: 'Inbound provisioning: an upstream IdP pushes users in. Admin-manage connectors; the /scim/v2 endpoints use a per-connector bearer token.',
    operations: [
      { method: 'POST', path: '/api/v1/provisioning/connectors', auth: 'Bearer + SCOPE_tenant:admin', summary: 'Create a connector (bearer token shown once).', request: '{ "name": "Entra" }', response: '{ "id": "...", "name": "Entra", "enabled": true, "token": "<one-time>", "scimBaseUrlPath": "/scim/v2" }' },
      { method: 'POST', path: '/scim/v2/Users', auth: 'Connector bearer token', summary: 'Provision a user (SCIM User → the directory).', request: '{ "schemas": ["urn:ietf:params:scim:schemas:core:2.0:User"], "userName": "jane", "emails": [{"value":"jane@acme.com"}], "active": true }' },
      { method: 'GET', path: '/scim/v2/Users?filter=userName eq "jane"', auth: 'Connector bearer token', summary: 'Find users (SCIM ListResponse).' },
      { method: 'PATCH', path: '/scim/v2/Users/{id}', auth: 'Connector bearer token', summary: 'Deactivate/reactivate (replace active).' },
      { method: 'GET', path: '/scim/v2/ServiceProviderConfig', auth: 'Connector bearer token', summary: 'SCIM capabilities.' },
    ],
  },
  {
    name: 'System log',
    service: 'identity-service',
    host: 'gateway',
    description: 'Tenant-scoped audit trail of authentication and admin events.',
    operations: [
      { method: 'GET', path: '/api/v1/system-log', auth: 'Bearer + SCOPE_tenant:admin', summary: 'Recent audit events (newest first).' },
    ],
  },
];
