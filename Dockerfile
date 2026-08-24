# syntax=docker/dockerfile:1
# Multi-stage: build the SPA with Node, serve the static bundle with nginx. Unlike the JVM services,
# the frontend is fully self-contained (no shared ~/.m2), so it builds inside the image.
#
# Vite inlines VITE_* at build time, so OIDC/API endpoints are baked in via build args.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# OIDC/API origins are REQUIRED and must be https:// — no plaintext defaults, so a build can never
# silently bake in http endpoints (security review L-console-1 / M-console-2). For local dev against
# the http docker-compose stack, pass --build-arg ALLOW_INSECURE_HTTP=true.
ARG VITE_OIDC_AUTHORITY
ARG VITE_OIDC_CLIENT_ID=aegis-dev-spa
ARG VITE_API_BASE
ARG ALLOW_INSECURE_HTTP=false
RUN if [ "$ALLOW_INSECURE_HTTP" != "true" ]; then \
      case "$VITE_OIDC_AUTHORITY" in \
        https://*) ;; \
        *) echo "ERROR: VITE_OIDC_AUTHORITY must be an https:// URL (got '$VITE_OIDC_AUTHORITY'). Set it via --build-arg, or pass ALLOW_INSECURE_HTTP=true for local dev." >&2; exit 1 ;; \
      esac; \
      case "$VITE_API_BASE" in \
        https://*) ;; \
        *) echo "ERROR: VITE_API_BASE must be an https:// URL (got '$VITE_API_BASE'). Set it via --build-arg, or pass ALLOW_INSECURE_HTTP=true for local dev." >&2; exit 1 ;; \
      esac; \
    fi
ENV VITE_OIDC_AUTHORITY=$VITE_OIDC_AUTHORITY \
    VITE_OIDC_CLIENT_ID=$VITE_OIDC_CLIENT_ID \
    VITE_API_BASE=$VITE_API_BASE
RUN npm run build

# Render the CSP from the SAME origins Vite just baked into the bundle, so the allowlist can never
# drift from the endpoints the app actually calls. The previous hand-maintained placeholder origins
# (https://REPLACE-with-...) blocked every API call in every environment: the browser refuses the
# cross-origin XHR before sending it, so the failure produced no server-side log line and surfaced
# in the UI as a misleading "organization id may already be taken".
RUN set -eu; \
    origin_of() { printf '%s' "$1" | sed -E 's#^([a-zA-Z][a-zA-Z0-9+.-]*://[^/]+).*#\1#'; }; \
    API_ORIGIN="$(origin_of "$VITE_API_BASE")"; \
    OIDC_ORIGIN="$(origin_of "$VITE_OIDC_AUTHORITY")"; \
    if [ -z "$API_ORIGIN" ] || [ -z "$OIDC_ORIGIN" ]; then \
      echo "ERROR: cannot derive CSP origins from VITE_API_BASE='$VITE_API_BASE' / VITE_OIDC_AUTHORITY='$VITE_OIDC_AUTHORITY'." >&2; exit 1; \
    fi; \
    if [ "$API_ORIGIN" = "$OIDC_ORIGIN" ]; then CONNECT_SRC="$API_ORIGIN"; else CONNECT_SRC="$API_ORIGIN $OIDC_ORIGIN"; fi; \
    sed -e "s#@@CSP_CONNECT_SRC@@#$CONNECT_SRC#" \
        -e "s#@@CSP_FRAME_SRC@@#$OIDC_ORIGIN#" \
        security-headers.conf.template > security-headers.conf; \
    if grep -q '@@' security-headers.conf; then echo "ERROR: unsubstituted CSP placeholder remains." >&2; exit 1; fi; \
    echo "CSP connect-src: 'self' $CONNECT_SRC"

# Unprivileged nginx: runs as uid 101 (non-root) and listens on 8080, so no root and no privileged port.
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Rendered in the build stage from the Vite origins (see above) — not the raw template.
COPY --from=build /app/security-headers.conf /etc/nginx/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=6 \
    CMD wget -qO- http://127.0.0.1:8080/ >/dev/null 2>&1 || exit 1
