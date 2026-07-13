/** DTOs mirroring the backend service contracts (SERVICE-CATALOG.md). */

export interface User {
  id: string;
  tenantId: string;
  username: string;
  email: string;
  status: 'ACTIVE' | 'DISABLED' | 'LOCKED';
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
}

export interface Application {
  id: string;
  name: string;
  clientId: string;
  type: 'OIDC' | 'SAML' | 'SERVICE';
  grantTypes: string[];
  scopes: string[];
  redirectUris: string[];
  status: 'ACTIVE' | 'INACTIVE';
}

/** One-time result of creating a service (M2M) app. The secret is shown only at creation. */
export interface ServiceApplicationCreated {
  id: string;
  name: string;
  clientId: string;
  clientSecret: string;
  tenant: string;
  scopes: string[];
}

export type ProviderProtocol = 'OIDC' | 'OAUTH2' | 'SAML';

export interface IdentityProvider {
  id: string;
  alias: string;
  providerKey: string;
  protocol: ProviderProtocol;
  displayName: string;
  enabled: boolean;
  clientId?: string;
  scopes?: string;
  issuerUri?: string;
  samlMetadataUrl?: string;
  hasSecret: boolean;
}

/** A supported provider preset; the console renders the "add provider" form from these. */
export interface ProviderCatalogEntry {
  key: string;
  displayName: string;
  protocol: ProviderProtocol;
  defaultScopes?: string;
  requiredFields: string[];
  notes?: string;
}

export interface CreateProviderRequest {
  providerKey: string;
  alias: string;
  displayName?: string;
  clientId?: string;
  clientSecret?: string;
  scopes?: string;
  userNameAttribute?: string;
  issuerUri?: string;
  providerDirectory?: string;
  samlMetadataUrl?: string;
  samlEntityId?: string;
}

export interface SystemLogEvent {
  id: string;
  at: string;
  type: string;
  action: string;
  outcome: 'SUCCESS' | 'FAILURE' | 'DENIED';
  actor: string;
  target?: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  primaryDomain?: string;
  status: 'ACTIVE' | 'SUSPENDED';
}
