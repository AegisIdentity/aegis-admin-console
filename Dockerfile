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

# Unprivileged nginx: runs as uid 101 (non-root) and listens on 8080, so no root and no privileged port.
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY security-headers.conf /etc/nginx/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=6 \
    CMD wget -qO- http://127.0.0.1:8080/ >/dev/null 2>&1 || exit 1
