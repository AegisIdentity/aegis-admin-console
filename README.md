# aegis-admin-console

The Okta-style front-end for the Aegis Identity Platform — a React + TypeScript + Vite SPA that is an
**OIDC `authorization_code`+PKCE client** of the authorization-server. Three surfaces in one app:

- **Admin console** — tenant admins configure the org: Dashboard, Users, Groups, Applications
  (OIDC/SAML), Identity Providers, Authentication Policies, Branding, System Log, Settings.
- **End-user portal** (`/my`) — "My Apps" launcher, Profile, and Security (passkeys/MFA).
- **Branded sign-in** (`/signin`) — themeable split-screen that starts the OIDC flow.

Design: **Ant Design themed with custom Aegis tokens** (`src/theme/`) — a component library under a
custom, ownable design system.

## Run
```bash
npm install
npm run dev          # http://localhost:5173  (sign-in works standalone; data needs the backend)
# For live data, run the backend stack: aegis-platform-infra/compose (gateway on :8080, AS on :9000)
```
The SPA client `aegis-dev-spa` is pre-registered in the authorization-server with this app's
redirect URIs (`http://localhost:5173/callback`, post-logout `/signin`).

## Build / test
```bash
npm run build        # tsc (strict) + vite build  -> dist/
npm run test         # vitest (jsdom + Testing Library)
```

## Maturity
Design system, OIDC PKCE auth, API client, routing, and the shells are **functional**. Users is
**fully wired** (list + create against identity-service); Applications/System Log render live data
when their services expose the endpoints; the remaining sections are honest capability pages that
name the owning backend service. See `CLAUDE.md`.
