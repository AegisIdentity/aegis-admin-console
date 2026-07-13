import { api } from './client';
import type {
  Application,
  CreateUserRequest,
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
  // (pending backend: identity-service currently exposes get-by-id + authenticate; a list endpoint
  // is a small addition.) Returns [] on 404 so the UI shows an empty state rather than an error.
  list: async (): Promise<User[]> => {
    const res = await api.get<User[]>('/api/v1/users').catch(() => ({ data: [] as User[] }));
    return res.data;
  },
  get: (id: string) => api.get<User>(`/api/v1/users/${id}`).then((r) => r.data),
  create: (body: CreateUserRequest) => api.post<User>('/api/v1/users', body).then((r) => r.data),
};

export const appsApi = {
  list: async (): Promise<Application[]> => {
    const res = await api
      .get<Application[]>('/api/v1/applications')
      .catch(() => ({ data: [] as Application[] }));
    return res.data;
  },
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
