import axios, { type InternalAxiosRequestConfig } from 'axios';
import { config } from '../config';
import { getAccessToken, userManager } from '../auth/userManager';

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
 * Recover from an expired access token. A long-lived console tab whose token has expired would
 * otherwise see every call 401 (exactly the failure in the network trace). On the first 401 we try a
 * silent renew (hidden-iframe refresh) and replay the request once; if that also fails the session is
 * genuinely gone, so we send the user back through sign-in rather than leaving a wall of 401s.
 */
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    if (error.response?.status === 401 && original && !original._retried) {
      original._retried = true;
      try {
        const renewed = await userManager.signinSilent();
        if (renewed?.access_token) {
          original.headers.Authorization = `Bearer ${renewed.access_token}`;
          return api.request(original);
        }
      } catch {
        /* fall through to redirect */
      }
      try {
        await userManager.signinRedirect();
      } catch {
        /* if redirect itself fails, surface the original error below */
      }
    }
    return Promise.reject(error);
  },
);

/**
 * Client for public, pre-authentication endpoints (e.g. onboarding). Deliberately has NO bearer
 * interceptor: a brand-new org has no token, and sending a stale one would trip the resource server.
 */
export const publicApi = axios.create({
  baseURL: config.apiBase,
  headers: { 'Content-Type': 'application/json' },
});
