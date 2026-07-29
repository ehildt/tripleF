# syntax=docker/dockerfile:1
#
# Standalone server image (app build context = ./server).
# NOTE: In this monorepo the canonical flow is the root ../Dockerfile +
# ../compose.yml (workspace-aware, driven by the root pnpm-lock.yaml).
# This file is kept for a potential repo split back into a standalone repo.

ARG NODE_VERSION=24
ARG PNPM_VERSION=11.17.0

FROM node:${NODE_VERSION} AS base
ENV CI=true PNPM_CONFIG_CONFIRM_MODULES_PURGE=false PNPM_CONFIG_MINIMUM_RELEASE_AGE=0
ENV PNPM_ENABLE_PROGRESS_BAR=false
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
WORKDIR /app
RUN corepack enable
RUN corepack prepare pnpm@${PNPM_VERSION} --activate
RUN chown node:node /app

FROM base AS local
COPY --chown=node:node . ./
EXPOSE 3000
USER node
RUN pnpm install

FROM base AS builder
COPY --chown=node:node package.json ./
COPY --chown=node:node tsconfig*.json ./
COPY --chown=node:node shims.d.ts ./
COPY --chown=node:node .env.example ./
COPY --chown=node:node prisma/ ./prisma/
COPY --chown=node:node src/ ./src/
USER node
RUN pnpm install

FROM base AS builddev
COPY --from=builder /app/node_modules /app/node_modules
WORKDIR /app
RUN pnpm run build

FROM base AS buildprod
COPY --from=builder /app/node_modules /app/node_modules
WORKDIR /app
RUN pnpm run build:prod

FROM base AS server-development
WORKDIR /app
ENV NODE_OPTIONS="--max-old-space-size=2048"
ENV NODE_ENV="development"
COPY --chown=node:node --from=builder /app/package.json ./package.json
COPY --chown=node:node --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --chown=node:node --from=builder /app/.env.example ./
COPY --chown=node:node --from=builder /app/prisma ./prisma
COPY --chown=node:node --from=builder /app/src ./src
COPY --chown=node:node --from=builddev /app/node_modules ./node_modules
COPY --chown=node:node --from=builddev /app/dist ./dist
EXPOSE 3000

FROM base AS server-production
WORKDIR /app
ENV NODE_OPTIONS="--max-old-space-size=2048"
COPY --chown=node:node --from=buildprod /app/package.json ./package.json
COPY --chown=node:node --from=buildprod /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --chown=node:node --from=buildprod /app/.env.example ./
COPY --chown=node:node --from=buildprod /app/prisma.config.ts ./
COPY --chown=node:node --from=buildprod /app/prisma ./prisma
COPY --chown=node:node --from=buildprod /app/src ./src
COPY --chown=node:node --from=buildprod /app/node_modules ./node_modules
COPY --chown=node:node --from=buildprod /app/dist ./dist
USER node
ENTRYPOINT [ "pnpm", "run", "start:node" ]
