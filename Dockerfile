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
ARG VITE_OIDC_AUTHORITY=http://authorization-server:9000
ARG VITE_OIDC_CLIENT_ID=aegis-dev-spa
ARG VITE_API_BASE=http://localhost:8080
ENV VITE_OIDC_AUTHORITY=$VITE_OIDC_AUTHORITY \
    VITE_OIDC_CLIENT_ID=$VITE_OIDC_CLIENT_ID \
    VITE_API_BASE=$VITE_API_BASE
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=6 \
    CMD wget -qO- http://localhost/ >/dev/null 2>&1 || exit 1
