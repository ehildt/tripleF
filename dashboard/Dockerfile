# Setup corepack + pnpm (cached)
FROM node:24 AS base
ENV CI=true
ENV PNPM_ENABLE_PROGRESS_BAR=false
ENV PNPM_CONFIG_CONFIRM_MODULES_PURGE=false
ENV PNPM_CONFIG_MINIMUM_RELEASE_AGE=0
RUN corepack enable && corepack prepare pnpm@11.2.2 --activate

WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV PNPM_STORE_DIR="/pnpm-store"

# Target: local (entrypoint for local development)
FROM base AS local
COPY . .
EXPOSE 5173
ENV NODE_OPTIONS="--max-old-space-size=1024"
ENTRYPOINT ["pnpm", "dev", "--host", "0.0.0.0", "--port", "5173"]

# Target: builder (shared build stage)
FROM base AS builder
COPY package.json ./

# Install root dependencies
RUN pnpm install

# Target: temporary (entrypoint for prepare-dev)
FROM builder AS builddev
COPY . .
RUN pnpm build

# Target: temporary (entrypoint for prepare-prod)
FROM builder AS buildprod
COPY . .
RUN pnpm build

# Target: development (entrypoint for dev-stage)
FROM base AS development
ENV                                         \
  NODE_OPTIONS="--max-old-space-size=1024"   \
  NODE_ENV="development"                    \
  PATH="$PNPM_HOME:$PATH"

COPY --chown=node:node --from=builddev /app/dist ./dist
COPY --chown=node:node --from=builddev /app/package*.json ./
COPY --chown=node:node --from=builddev /app/node_modules ./node_modules

EXPOSE 5173
USER node
ENTRYPOINT ["pnpm", "dev", "--host", "0.0.0.0", "--port", "5173"]

# Target: production (static)
FROM nginx:alpine AS production
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=buildprod /app/dist/ /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]