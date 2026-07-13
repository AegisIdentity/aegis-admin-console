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
  type: 'OIDC' | 'SAML';
  grantTypes: string[];
  redirectUris: string[];
  status: 'ACTIVE' | 'INACTIVE';
}

export interface IdentityProvider {
  id: string;
  name: string;
  protocol: 'SOCIAL_OIDC' | 'SAML' | 'OIDC';
  vendor: string;
  enabled: boolean;
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
