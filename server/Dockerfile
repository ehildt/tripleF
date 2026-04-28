# Setup corepack + pnpm (cached)
FROM node:24 AS base
RUN corepack enable && corepack prepare pnpm@10.17.1 --activate

WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Target: local (entrypoint for local development)
FROM base AS local
COPY . .
EXPOSE 3000
ENTRYPOINT ["pnpm", "start:dev"]

# Target: builder (shared build stage)
FROM base AS builder
COPY package.json tsconfig*.json shims.d.ts ./
COPY .env.example ./
COPY prisma/ ./prisma/
COPY src/ ./src/

# Install root dependencies (triggers prisma generate)
RUN pnpm install

# Target: temporary (entrypoint for prepare-dev)
FROM builder AS builddev
COPY . .
RUN pnpm run build

# Target: temporary (entrypoint for prepare-prod)
FROM builder AS buildprod
COPY . .
RUN pnpm run build:prod

# Target: development (entrypoint for dev-stage)
FROM base AS development
ENV NODE_OPTIONS="--max-old-space-size=256"

COPY --chown=node:node --from=builddev /app/dist ./dist
COPY --chown=node:node --from=builddev /app/package*.json ./
COPY --chown=node:node --from=builddev /app/.env.example ./
COPY --chown=node:node --from=builddev /app/node_modules ./node_modules

EXPOSE 3000
USER node
ENTRYPOINT ["pnpm", "run", "start:node"]

# Target: production (entrypoint for prod-stage)
FROM base AS production
ENV NODE_OPTIONS="--max-old-space-size=256"

COPY --chown=node:node --from=buildprod /app/dist ./dist
COPY --chown=node:node --from=buildprod /app/package*.json ./
COPY --chown=node:node --from=buildprod /app/.env.example ./
COPY --chown=node:node --from=buildprod /app/node_modules ./node_modules

EXPOSE 3000
USER node
ENTRYPOINT ["pnpm", "run", "start:node"]