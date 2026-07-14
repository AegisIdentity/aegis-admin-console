/**
 * Step-by-step guides for configuring each authentication mechanism on the platform, and for combining
 * them. Rendered in the console Documentation hub. `steps` may contain `inline code` in backticks.
 */

export interface Guide {
  id: string;
  title: string;
  tag: string;
  intro: string;
  /** Where in this console to do it. */
  console?: string;
  steps: string[];
  note?: string;
}

export const GUIDES: Guide[] = [
  {
    id: 'password',
    title: 'Password sign-in & password policy',
    tag: 'Built-in',
    intro:
      'Password login works out of the box for every organization — credentials are verified per-tenant against the directory. You control strength and lockout with the authentication policy.',
    console: 'Security → Authentication Policies',
    steps: [
      'Create users under Directory → Users (or let them self-register — see Self-service sign-up in Settings).',
      'Open Security → Authentication Policies and set minimum length and the character classes you require.',
      'Set the lockout threshold and duration to throttle brute-force attempts.',
      'Users sign in at your hosted login page with Organization + Username + Password.',
    ],
    note: 'Password rules are enforced on user creation and password change; lockout is enforced during sign-in.',
  },
  {
    id: 'mfa',
    title: 'MFA — authenticator app (TOTP) & step-up',
    tag: 'MFA',
    intro:
      'Require a second factor after the password. Users enrol a TOTP authenticator (or a passkey) in the end-user portal; when MFA is required, the login flow challenges them before any token is issued.',
    console: 'Security → Authentication Policies · end-user portal → Security',
    steps: [
      'Turn on Require MFA in Security → Authentication Policies and choose which factor types are accepted (Authenticator app / Passkey).',
      'Users enrol under My → Security: "Set up authenticator" shows a QR code; scanning it and entering a code enables TOTP.',
      'At the next sign-in, an enrolled user is challenged for their code; if the org requires MFA but the user has no factor, they are forced to enrol one before login completes.',
      'The gate is enforced at the authorization endpoint — a password-only session cannot obtain a token.',
    ],
    note: 'TOTP step-up is enforced today; passkey-as-second-factor after password reuses the same machinery and is on the roadmap.',
  },
  {
    id: 'passkeys',
    title: 'Passkeys (WebAuthn / FIDO2)',
    tag: 'Passkeys',
    intro:
      'Passwordless, phishing-resistant sign-in. On the hosted login there is nothing to build — the "Sign in with a passkey" button is already there. For your OWN app to run the ceremony, configure a per-tenant Relying Party.',
    console: 'Security → Passkeys · end-user portal → Security',
    steps: [
      'Hosted: users register a passkey under My → Security (bound to the Aegis login host). "Sign in with a passkey" then works on the hosted login page.',
      'Embedded (your app): open Security → Passkeys and set the Relying Party — your rpId (e.g. `acme.com`) and allowed origins (`https://app.acme.com`).',
      'For mobile, host the association files shown on the Passkeys page: iOS `apple-app-site-association` (webcredentials) and Android `assetlinks.json`.',
      'Your app calls the tenant-app WebAuthn endpoints (see API Reference → Tenant-app embedded auth): register/options+finish, then login/options+finish → interaction_code → token.',
    ],
    note: 'A custom rpId means passkeys must be registered from your own app origin, not the Aegis console.',
  },
  {
    id: 'social',
    title: 'Social & OIDC login (Google, Entra, Apple, GitHub, generic)',
    tag: 'Federation',
    intro:
      'Let users sign in with an external identity provider. Aegis brokers the whole flow and JIT-provisions the user (by verified email); your apps just receive Aegis tokens — no provider SDK required.',
    console: 'Security → Identity Providers',
    steps: [
      'In the provider\'s developer console, create an OAuth app and register the Aegis callback `…/login/oauth2/code/{tenant}__{alias}` as its redirect URI.',
      'In Security → Identity Providers, pick the provider from the catalog and enter its client id + secret (Entra also needs the directory/tenant id).',
      'The hosted login now shows a "Continue with <provider>" button for your organization.',
      'To land users directly on a provider from your app, append `?idp_hint=<alias>` to the /oauth2/authorize request — the chooser is skipped.',
    ],
    note: 'Account linking is only ever done on a provider-verified email, to prevent takeover.',
  },
  {
    id: 'saml',
    title: 'SAML 2.0 SSO',
    tag: 'Enterprise',
    intro:
      'Federate with an enterprise SAML IdP. Aegis acts as the Service Provider; assertions are IdP-signed and JIT-provisioned.',
    console: 'Security → Identity Providers',
    steps: [
      'Add a SAML provider in Security → Identity Providers with the IdP\'s metadata URL.',
      'Register the Aegis SP with your IdP: the SP metadata is published at `/saml2/service-provider-metadata/{tenant}__{alias}` and the ACS is `/login/saml2/sso/{tenant}__{alias}`.',
      'The hosted login shows a "Continue with <IdP>" button that starts at `/saml2/authenticate/{tenant}__{alias}`.',
    ],
    note: 'A live round-trip needs your real IdP; the SP side (metadata, ACS, assertion mapping) is built.',
  },
  {
    id: 'm2m',
    title: 'Machine-to-machine (client_credentials)',
    tag: 'Backend',
    intro: 'For your backend services to call Aegis (or your own) APIs without a user, using the OAuth client_credentials grant.',
    console: 'Applications',
    steps: [
      'In Applications, create a service credential and choose the scopes it may hold. The secret is shown once — store it securely.',
      'Your backend requests a token: `POST /oauth2/token` with HTTP Basic (client id/secret) and `grant_type=client_credentials`.',
      'Present the access token as a bearer to the target API; scopes are enforced by the downstream service.',
    ],
  },
  {
    id: 'domains',
    title: 'Custom sign-in domain',
    tag: 'White-label',
    intro: 'Serve the hosted login on your own host (login.acme.com) for full white-labelling.',
    console: 'Custom Domains',
    steps: [
      'Add your domain in Custom Domains — the page shows a CNAME and a verification TXT record.',
      'Publish both records at your DNS provider, then click Verify.',
      'Once verified, point the domain at the Aegis ingress and terminate TLS there (deploy-time / cloud step).',
    ],
    note: 'TLS issuance + Host-based routing are handled at deploy time; locally, verification is auto-approved for testing.',
  },
  {
    id: 'scim',
    title: 'SCIM 2.0 provisioning (inbound)',
    tag: 'Enterprise',
    intro: 'Let an upstream IdP (Entra, Okta, Workday) automatically create and deactivate users in your organization.',
    console: 'Directory → Provisioning (SCIM)',
    steps: [
      'In Directory → Provisioning, create a connector — copy the SCIM base URL and the one-time bearer token.',
      'In the upstream IdP\'s provisioning settings, paste the SCIM base URL (`…/scim/v2`) and the bearer token.',
      'The IdP provisions users in (create/update); deactivations deprovision them here.',
    ],
  },
  {
    id: 'rbac',
    title: 'Admin roles (RBAC)',
    tag: 'Governance',
    intro: 'Give admin staff least-privilege access instead of everyone being a full admin.',
    console: 'Security → Admins & Roles',
    steps: [
      'Review the built-in roles and their permissions in Security → Admins & Roles.',
      'Assign one or more roles to each admin by username (e.g. HELP_DESK can reset/unlock but not change policy).',
      'An admin with no assignment but a tenant-admin token is treated as SUPER_ADMIN (backward-compatible).',
    ],
  },
  {
    id: 'embedded',
    title: 'Embedded auth in your own app (mobile & web)',
    tag: 'Developer',
    intro:
      'When you want your app\'s own UI (not the hosted page) to run passkey or native-social login and receive Aegis tokens. The app authenticates the user out-of-band, gets a single-use PKCE interaction_code, and swaps it for tokens.',
    console: 'Settings → Developer & API access · Security → Passkeys',
    steps: [
      'Register your app under Applications (public + PKCE) and note its client id.',
      'Passkey login: POST /api/v1/webauthn/login/options → run `navigator.credentials.get()` (web) / Credential Manager (Android) / ASAuthorization (iOS) → POST /api/v1/webauthn/login/finish → interaction_code.',
      'Native social: get an id_token from the provider\'s native SDK → POST /api/v1/social/native (provider alias + id_token) → interaction_code.',
      'Swap it: POST /api/v1/oauth/interaction/token with the interaction_code + your PKCE code_verifier → Aegis access + id tokens.',
    ],
    note: 'These endpoints are on the issuer host with permissive CORS; they are bearer/code-based (no cookies).',
  },
  {
    id: 'combining',
    title: 'Combining multiple mechanisms',
    tag: 'Patterns',
    intro:
      'One organization can offer several sign-in methods at once — they compose. A typical Okta-style setup layers them.',
    steps: [
      'Base: password sign-in with a strong password policy.',
      'Add social/OIDC + SAML providers — they appear as extra buttons on the same hosted login page; add ?idp_hint to deep-link.',
      'Turn on Require MFA and accept both TOTP and passkeys — enrolled users are stepped up after password; passkey users are already MFA-grade.',
      'Offer passwordless passkey sign-in as a primary option alongside password.',
      'Use SCIM for lifecycle (joiner/leaver) and RBAC to scope which admins can change any of the above.',
      'For embedded apps, expose the same providers via the tenant-app API (idp_hint for social, WebAuthn endpoints for passkeys).',
    ],
    note: 'All of these are per-tenant: each organization configures its own mix without affecting others.',
  },
];
