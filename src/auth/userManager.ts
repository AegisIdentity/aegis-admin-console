import { UserManager, WebStorageStateStore, type User } from 'oidc-client-ts';
import { config } from '../config';

/**
 * The OIDC client. `authorization_code` + PKCE against the Aegis authorization-server (oidc-client-ts
 * performs PKCE automatically for the code flow). Metadata is discovered from
 * `${authority}/.well-known/openid-configuration`, so nothing here hard-codes endpoints.
 */
export const userManager = new UserManager({
  authority: config.oidcAuthority,
  client_id: config.oidcClientId,
  redirect_uri: config.redirectUri,
  post_logout_redirect_uri: config.postLogoutRedirectUri,
  response_type: 'code',
  scope: config.scope,
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  automaticSilentRenew: true,
  monitorSession: false,
});

export async function getAccessToken(): Promise<string | null> {
  const user = await userManager.getUser();
  return user?.access_token ?? null;
}

export type { User };
