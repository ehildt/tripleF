# syntax=docker/dockerfile:1

# Monorepo image for tripleF (3F) (pnpm workspace).
# Single source of truth for dependencies is the ROOT pnpm-lock.yaml;
# per-app lockfiles must not exist. The pnpm version is pinned via the
# root package.json "packageManager" field and resolved by corepack.

# Stage: base (shared by all targets)
FROM node:24 AS base
ENV CI=true \
    PNPM_ENABLE_PROGRESS_BAR=false \
    PNPM_CONFIG_CONFIRM_MODULES_PURGE=false \
    PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 \
    HUSKY=0 \
    PNPM_HOME="/pnpm" \
    pnpm_config_store_dir="/repo/.pnpm-store"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /repo

# Target: local (entrypoint for local development)
# No sources are copied here — compose bind-mounts the repository at /repo
# and the one-shot `deps` service installs workspace dependencies onto it,
# so host and containers always share one node_modules layout.
# verify_deps_before_run is disabled: dependency state is owned by `deps`,
# implicit installs at service start must never rewrite it.
FROM base AS local
ENV pnpm_config_verify_deps_before_run=false
EXPOSE 3000 5173

# Stage: deps (workspace install, shared by all build stages)
# NOTE: pnpm 11 requires pnpm_config_* env vars; legacy PNPM_STORE_DIR is ignored.
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY server/package.json server/
COPY server/prisma server/prisma
COPY dashboard/package.json dashboard/
RUN --mount=type=cache,id=pnpm,target=/repo/.pnpm-store \
    pnpm install --frozen-lockfile

# Stage: buildserver-dev (compile for the dev-stage runtime)
# NOTE: keep the copied file set minimal — stray root-level .ts files shift
# tsc's computed rootDir and would nest the output into dist/src/.
FROM deps AS buildserver-dev
COPY server/tsconfig*.json server/shims.d.ts server/
COPY server/src server/src
RUN pnpm --filter "{server}" run build \
    && pnpm deploy --legacy --filter "{server}" /prod/server

# Stage: buildserver-prod (compile for the prod-stage runtime)
FROM deps AS buildserver-prod
COPY server/tsconfig*.json server/shims.d.ts server/
COPY server/src server/src
RUN pnpm --filter "{server}" run build:prod \
    && pnpm deploy --legacy --filter "{server}" --prod /prod/server

# Stage: builddashboard-dev (isolated install for the dev-stage runtime)
FROM deps AS builddashboard-dev
COPY dashboard/ dashboard/
RUN pnpm deploy --legacy --filter "{dashboard}" /prod/dashboard

# Stage: builddashboard (compile static assets)
FROM deps AS builddashboard
COPY dashboard/ dashboard/
RUN pnpm --filter "{dashboard}" run build

# Target: server-development (entrypoint for dev-stage)
FROM base AS server-development
WORKDIR /app
ENV NODE_OPTIONS="--max-old-space-size=2048" \
    NODE_ENV="development" \
    pnpm_config_verify_deps_before_run=false
COPY --chown=node:node --from=buildserver-dev /prod/server ./
COPY --chown=node:node --from=buildserver-dev /repo/server/dist ./dist
EXPOSE 3000
USER node
ENTRYPOINT ["pnpm", "run", "start:node"]

# Target: server-production (entrypoint for prod-stage)
FROM base AS server-production
WORKDIR /app
ENV NODE_OPTIONS="--max-old-space-size=2048" \
    pnpm_config_verify_deps_before_run=false
COPY --chown=node:node --from=buildserver-prod /prod/server ./
COPY --chown=node:node --from=buildserver-prod /repo/server/dist ./dist
EXPOSE 3000
USER node
ENTRYPOINT ["pnpm", "run", "start:node"]

# Target: dashboard-development (entrypoint for dev-stage)
FROM base AS dashboard-development
WORKDIR /app
ENV NODE_OPTIONS="--max-old-space-size=1024" \
    NODE_ENV="development" \
    pnpm_config_verify_deps_before_run=false
COPY --chown=node:node --from=builddashboard-dev /prod/dashboard ./
EXPOSE 5173
USER node
ENTRYPOINT ["pnpm", "dev", "--host", "0.0.0.0", "--port", "5173"]

# Target: dashboard-production (static, served by nginx)
FROM nginx:alpine AS dashboard-production
COPY dashboard/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builddashboard /repo/dashboard/dist/ /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
