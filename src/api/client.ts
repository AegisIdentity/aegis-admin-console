import axios from 'axios';
import { config } from '../config';
import { getAccessToken } from '../auth/userManager';

/**
 * API client pointed at the edge gateway. Every request carries the current OIDC access token as a
 * bearer credential; the downstream services validate it and enforce scopes.
 */
export const api = axios.create({
  baseURL: config.apiBase,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (cfg) => {
  const token = await getAccessToken();
  if (token) {
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

/**
 * Client for public, pre-authentication endpoints (e.g. onboarding). Deliberately has NO bearer
 * interceptor: a brand-new org has no token, and sending a stale one would trip the resource server.
 */
export const publicApi = axios.create({
  baseURL: config.apiBase,
  headers: { 'Content-Type': 'application/json' },
});
