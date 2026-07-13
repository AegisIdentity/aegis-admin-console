import { api, publicApi } from './client';
import type {
  Application,
  CreateGroupRequest,
  CreateUserRequest,
  Group,
  IdentityProvider,
  SystemLogEvent,
  Tenant,
  User,
} from './types';

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
  remove: (id: string) => api.delete<void>(`/api/v1/applications/${id}`).then((r) => r.data),
};

export const idpApi = {
  list: async (): Promise<IdentityProvider[]> => {
    const res = await api
      .get<IdentityProvider[]>('/api/v1/identity-providers')
      .catch(() => ({ data: [] as IdentityProvider[] }));
    return res.data;
  },
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
