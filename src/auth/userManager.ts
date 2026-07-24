import { InMemoryWebStorage, UserManager, WebStorageStateStore, type User } from 'oidc-client-ts';
import { config } from '../config';

/**
 * The OIDC client. `authorization_code` + PKCE against the Aegis authorization-server (oidc-client-ts
 * performs PKCE automatically for the code flow). Metadata is discovered from
 * `${authority}/.well-known/openid-configuration`, so nothing here hard-codes endpoints.
 *
 * Token storage (security):
 *  - `userStore` (holds the access + refresh tokens) uses an in-memory store, so tokens never touch
 *    `localStorage`/`sessionStorage`. This shrinks the XSS blast radius — a script injected into the
 *    console cannot read persisted admin tokens — and drops them entirely when the tab closes.
 *  - `stateStore` (transient PKCE verifier / auth-request state) uses `sessionStorage`: it must survive
 *    the full-page redirect to the authorization-server and back, which an in-memory store cannot.
 *    `sessionStorage` is scoped to the tab and shared with the same-origin silent-renew iframe, so
 *    `automaticSilentRenew` keeps working while the state is still cleared when the tab closes.
 */
export const userManager = new UserManager({
  authority: config.oidcAuthority,
  client_id: config.oidcClientId,
  redirect_uri: config.redirectUri,
  post_logout_redirect_uri: config.postLogoutRedirectUri,
  response_type: 'code',
  scope: config.scope,
  userStore: new WebStorageStateStore({ store: new InMemoryWebStorage() }),
  stateStore: new WebStorageStateStore({ store: window.sessionStorage }),
  automaticSilentRenew: true,
  monitorSession: false,
});

export async function getAccessToken(): Promise<string | null> {
  const user = await userManager.getUser();
  return user?.access_token ?? null;
}

export type { User };
