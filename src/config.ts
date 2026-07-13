/**
 * Runtime configuration, sourced from Vite env vars (VITE_*) with dev-friendly defaults that match
 * the local docker-compose stack. Override in `.env.local` or at build/deploy time.
 */
export const config = {
  /** The authorization-server issuer (OIDC authority). */
  oidcAuthority: import.meta.env.VITE_OIDC_AUTHORITY ?? 'http://localhost:9000',
  /** The public SPA client id registered in the authorization-server (aegis-dev-spa). */
  oidcClientId: import.meta.env.VITE_OIDC_CLIENT_ID ?? 'aegis-dev-spa',
  /** Where the API calls go — the edge gateway in a real deployment. */
  apiBase: import.meta.env.VITE_API_BASE ?? 'http://localhost:8080',
  /** OIDC redirect targets (must be registered on the client). */
  redirectUri: `${window.location.origin}/callback`,
  postLogoutRedirectUri: `${window.location.origin}/signin`,
  /** Scopes the console requests. Must be a subset of what the aegis-dev-spa client is allowed to
   *  request in the authorization-server. `idp:admin` is required by the Identity Providers page;
   *  self-service MFA and password change operate on the token subject and need no extra scope. */
  scope:
    'openid profile identity:users:read identity:users:write ' +
    'identity:groups:read identity:groups:write ' +
    'tenant:read tenant:admin applications:admin idp:admin',
} as const;
