import { api, publicApi } from './client';
import type {
  Application,
  AuthPolicy,
  Branding,
  CreateGroupRequest,
  CreateProviderRequest,
  CreateUserRequest,
  Group,
  IdentityProvider,
  MfaFactors,
  Passkey,
  ProviderCatalogEntry,
  AdminAssignment,
  AdminMe,
  AdminRoleCatalogEntry,
  CustomDomain,
  ScimConnector,
  ScimConnectorCreated,
  ServiceApplicationCreated,
  SystemLogEvent,
  Tenant,
  TotpEnrollment,
  User,
  WebAuthnAuditEvent,
  WebAuthnRpConfig,
} from './types';

/** Scopes a tenant may grant to its own service (M2M) clients — mirrors the server allowlist. */
export const GRANTABLE_SERVICE_SCOPES = [
  'identity:users:read',
  'identity:users:write',
  'identity:groups:read',
  'identity:groups:write',
  'tenant:read',
] as const;

/**
 * Typed API modules. Endpoints marked "(pending backend)" are called against the intended contract
 * in SERVICE-CATALOG.md; the corresponding service endpoint is on the roadmap, so the UI degrades
 * gracefully (empty/error states via react-query) until it lands.
 */

export const usersApi = {
  list: async (): Promise<User[]> => {
    const res = await api.get<User[]>('/api/v1/users').catch(() => ({ data: [] as User[] }));
    return res.data;
  },
  get: (id: string) => api.get<User>(`/api/v1/users/${id}`).then((r) => r.data),
  create: (body: CreateUserRequest) => api.post<User>('/api/v1/users', body).then((r) => r.data),
  disable: (id: string) => api.post<User>(`/api/v1/users/${id}/disable`).then((r) => r.data),
  enable: (id: string) => api.post<User>(`/api/v1/users/${id}/enable`).then((r) => r.data),
  remove: (id: string) => api.delete<void>(`/api/v1/users/${id}`).then((r) => r.data),
};

export const groupsApi = {
  list: async (): Promise<Group[]> => {
    const res = await api.get<Group[]>('/api/v1/groups').catch(() => ({ data: [] as Group[] }));
    return res.data;
  },
  create: (body: CreateGroupRequest) => api.post<Group>('/api/v1/groups', body).then((r) => r.data),
  remove: (id: string) => api.delete<void>(`/api/v1/groups/${id}`).then((r) => r.data),
  members: (id: string) => api.get<User[]>(`/api/v1/groups/${id}/members`).then((r) => r.data),
  addMember: (id: string, userId: string) =>
    api.post<void>(`/api/v1/groups/${id}/members`, { userId }).then((r) => r.data),
  removeMember: (id: string, userId: string) =>
    api.delete<void>(`/api/v1/groups/${id}/members/${userId}`).then((r) => r.data),
};

export const appsApi = {
  list: async (): Promise<Application[]> => {
    const res = await api
      .get<Application[]>('/api/v1/applications')
      .catch(() => ({ data: [] as Application[] }));
    return res.data;
  },
  create: (body: { name: string; redirectUri: string }) =>
    api.post<Application>('/api/v1/applications', body).then((r) => r.data),
  createService: (body: { name: string; scopes: string[] }) =>
    api.post<ServiceApplicationCreated>('/api/v1/applications/service', body).then((r) => r.data),
  remove: (id: string) => api.delete<void>(`/api/v1/applications/${id}`).then((r) => r.data),
};

export const idpApi = {
  list: async (): Promise<IdentityProvider[]> => {
    const res = await api
      .get<IdentityProvider[]>('/api/v1/identity-providers')
      .catch(() => ({ data: [] as IdentityProvider[] }));
    return res.data;
  },
  catalog: async (): Promise<ProviderCatalogEntry[]> => {
    const res = await api
      .get<ProviderCatalogEntry[]>('/api/v1/identity-providers/catalog')
      .catch(() => ({ data: [] as ProviderCatalogEntry[] }));
    return res.data;
  },
  create: (body: CreateProviderRequest) =>
    api.post<IdentityProvider>('/api/v1/identity-providers', body).then((r) => r.data),
  update: (id: string, body: { enabled?: boolean; displayName?: string; scopes?: string; clientSecret?: string }) =>
    api.put<IdentityProvider>(`/api/v1/identity-providers/${id}`, body).then((r) => r.data),
  remove: (id: string) => api.delete<void>(`/api/v1/identity-providers/${id}`).then((r) => r.data),
};

export const logsApi = {
  list: async (): Promise<SystemLogEvent[]> => {
    const res = await api
      .get<SystemLogEvent[]>('/api/v1/system-log')
      .catch(() => ({ data: [] as SystemLogEvent[] }));
    return res.data;
  },
};

export const tenantApi = {
  get: (slug: string) => api.get<Tenant>(`/api/v1/tenants/${slug}`).then((r) => r.data),
};

export interface OnboardRequest {
  organizationName: string;
  tenantSlug: string;
  adminUsername: string;
  adminEmail: string;
  adminPassword: string;
}

export const onboardingApi = {
  // Public (no token): bootstraps a new org's first admin.
  signup: (body: OnboardRequest) =>
    publicApi.post<{ tenant: string; adminUsername: string }>('/api/v1/onboarding', body).then((r) => r.data),
};

export interface SignupPolicy {
  tenant: string;
  signupEnabled: boolean;
}

export interface RegisterRequest {
  tenantSlug: string;
  username: string;
  email: string;
  password: string;
}

/** The tenant admin's self-service sign-up policy (authenticated; tenant is derived from the token). */
export const signupPolicyApi = {
  get: () => api.get<SignupPolicy>('/api/v1/signup-policy').then((r) => r.data),
  set: (enabled: boolean) =>
    api.put<SignupPolicy>('/api/v1/signup-policy', { enabled }).then((r) => r.data),
};

export const registerApi = {
  // Public (no token): a tenant's end-user self-registers. Succeeds only if the org opted in.
  register: (body: RegisterRequest) =>
    publicApi.post<{ tenant: string; username: string }>('/api/v1/signup', body).then((r) => r.data),
};

/** The tenant's authentication policy (password rules, lockout, MFA, session TTL). */
export const authPolicyApi = {
  get: () => api.get<AuthPolicy>('/api/v1/auth-policy').then((r) => r.data),
  update: (body: AuthPolicy) => api.put<AuthPolicy>('/api/v1/auth-policy', body).then((r) => r.data),
};

/** The tenant's sign-in branding (product name, heading, subtitle, primary color). */
export const brandingApi = {
  get: () => api.get<Branding>('/api/v1/branding').then((r) => r.data),
  update: (body: Branding) => api.put<Branding>('/api/v1/branding', body).then((r) => r.data),
};

/**
 * Self-service MFA (mfa-webauthn-service). Every call operates on the signed-in user's own subject
 * (taken server-side from the token), so no ids are passed for the caller.
 */
export const mfaApi = {
  factors: () => api.get<MfaFactors>('/api/v1/mfa/factors').then((r) => r.data),
  enrollTotp: () => api.post<TotpEnrollment>('/api/v1/mfa/totp/enroll').then((r) => r.data),
  verifyTotp: (code: string) => api.post<void>('/api/v1/mfa/totp/verify', { code }).then((r) => r.data),
  removeTotp: () => api.delete<void>('/api/v1/mfa/totp').then((r) => r.data),
  passkeyOptions: () =>
    api.post<PublicKeyCredentialCreationOptionsJSON>('/api/v1/mfa/webauthn/register/options').then((r) => r.data),
  passkeyFinish: (body: { attestationObject: string; clientDataJSON: string; label?: string }) =>
    api.post<Passkey>('/api/v1/mfa/webauthn/register/finish', body).then((r) => r.data),
  removePasskey: (id: string) => api.delete<void>(`/api/v1/mfa/webauthn/${id}`).then((r) => r.data),
};

/** The raw creation options the server returns (base64url fields), passed to the WebAuthn helper. */
export interface PublicKeyCredentialCreationOptionsJSON {
  challenge: string;
  rp: { id: string; name: string };
  user: { id: string; name: string; displayName: string };
  pubKeyCredParams: { type: string; alg: number }[];
  timeout?: number;
  attestation?: string;
  authenticatorSelection?: Record<string, string>;
  excludeCredentials?: { type: string; id: string }[];
}

/** The signed-in user changing their own password (identity-service). */
export const accountApi = {
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<void>('/api/v1/users/me/password', { currentPassword, newPassword }).then((r) => r.data),
};

/** RBAC admin roles + assignments (admin-api-service). */
export const rbacApi = {
  roles: async (): Promise<AdminRoleCatalogEntry[]> => {
    const res = await api.get<AdminRoleCatalogEntry[]>('/api/v1/admin/roles').catch(() => ({ data: [] }));
    return res.data;
  },
  admins: async (): Promise<AdminAssignment[]> => {
    const res = await api.get<AdminAssignment[]>('/api/v1/admin/admins').catch(() => ({ data: [] }));
    return res.data;
  },
  setRoles: (subject: string, roles: string[]) =>
    api.put<AdminAssignment>(`/api/v1/admin/admins/${encodeURIComponent(subject)}`, { roles }).then((r) => r.data),
  removeAdmin: (subject: string) =>
    api.delete<void>(`/api/v1/admin/admins/${encodeURIComponent(subject)}`).then((r) => r.data),
  me: () => api.get<AdminMe>('/api/v1/admin/me').then((r) => r.data),
};

/** SCIM inbound provisioning connectors (scim-provisioning-service). */
export const provisioningApi = {
  connectors: async (): Promise<ScimConnector[]> => {
    const res = await api.get<ScimConnector[]>('/api/v1/provisioning/connectors').catch(() => ({ data: [] }));
    return res.data;
  },
  createConnector: (name: string) =>
    api.post<ScimConnectorCreated>('/api/v1/provisioning/connectors', { name }).then((r) => r.data),
  removeConnector: (id: string) =>
    api.delete<void>(`/api/v1/provisioning/connectors/${id}`).then((r) => r.data),
};

/** Custom sign-in domains (tenant-service). */
export const domainsApi = {
  list: async (): Promise<CustomDomain[]> => {
    const res = await api.get<CustomDomain[]>('/api/v1/domains').catch(() => ({ data: [] }));
    return res.data;
  },
  add: (domain: string) => api.post<CustomDomain>('/api/v1/domains', { domain }).then((r) => r.data),
  verify: (id: string) => api.post<CustomDomain>(`/api/v1/domains/${id}/verify`).then((r) => r.data),
  remove: (id: string) => api.delete<void>(`/api/v1/domains/${id}`).then((r) => r.data),
};

/** Per-tenant WebAuthn RP configuration + passkey audit (mfa-webauthn-service, tenant:admin). */
export const passkeyAdminApi = {
  getConfig: () => api.get<WebAuthnRpConfig>('/api/v1/mfa/webauthn/config').then((r) => r.data),
  updateConfig: (body: WebAuthnRpConfig) =>
    api.put<WebAuthnRpConfig>('/api/v1/mfa/webauthn/config', body).then((r) => r.data),
  audit: async (): Promise<WebAuthnAuditEvent[]> => {
    const res = await api
      .get<WebAuthnAuditEvent[]>('/api/v1/mfa/webauthn/audit')
      .catch(() => ({ data: [] as WebAuthnAuditEvent[] }));
    return res.data;
  },
};
