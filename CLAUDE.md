# aegis-admin-console — working notes

Okta-style front-end for Aegis. **React 19 + TypeScript (strict) + Vite 6**, Ant Design (custom
theme), TanStack Query, react-router 7, **oidc-client-ts** for OIDC PKCE. Node 20+.

## Layout
- `src/auth/` — OIDC PKCE. `userManager.ts` (oidc-client-ts), `AuthContext` (`useAuth`), `Callback`,
  `RequireAuth` guard. Access token is injected into every API call by `src/api/client.ts`.
- `src/api/` — axios client + typed modules (`endpoints.ts`, `types.ts`) matching SERVICE-CATALOG.md.
- `src/theme/` — the design system: antd `ThemeConfig` tokens + CSS variables (the ownable look).
- `src/components/` — `AdminLayout` (sidebar shell), `PortalLayout`, `PageHeader`, `FeaturePage`.
- `src/pages/admin/`, `src/pages/portal/`, `src/pages/SignIn.tsx` — the three surfaces.

## Non-negotiables
- Never store tokens anywhere but the oidc-client-ts user store; never log tokens.
- Every network call goes through `src/api/client.ts` (bearer injection) — don't hand-roll fetch.
- New pages that read data use TanStack Query with graceful empty/error states (backend services are
  at varying maturity — the UI must not hard-fail when an endpoint 404s).
- Keep strict TypeScript green (`verbatimModuleSyntax`, `noUnusedLocals`): use `import type` for types.

## Build / test
`npm run build` (tsc strict + vite) and `npm run test` (vitest) must both pass. Bundle is antd-heavy;
code-splitting per route is a known optimization (chunk-size warning is expected for now).

## Backend integration
OIDC client `aegis-dev-spa` (PKCE) is registered in the authorization-server with this app's redirect
URIs. Data APIs go via the edge gateway (`:8080`). "Wire the backend" items in the UI name the owning
service (identity/tenant live; apps/idps/mfa/admin scaffolded).
