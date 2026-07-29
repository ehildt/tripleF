# syntax=docker/dockerfile:1
#
# Standalone dashboard image (app build context = ./dashboard).
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
EXPOSE 5173
USER node
RUN pnpm install

FROM base AS builder
COPY --chown=node:node package.json ./
USER node
RUN pnpm install
COPY --chown=node:node . ./

FROM base AS build
COPY --from=builder /app/node_modules /app/node_modules
WORKDIR /app
RUN pnpm run build

FROM base AS dashboard-development
WORKDIR /app
ENV NODE_OPTIONS="--max-old-space-size=1024"
ENV NODE_ENV="development"
COPY --chown=node:node --from=builder /app ./
EXPOSE 5173

FROM base AS dashboard-production
WORKDIR /app
ENV NODE_OPTIONS="--max-old-space-size=1024"
COPY --chown=node:node --from=build /app/node_modules ./node_modules/
COPY --chown=node:node --from=build /app/dist ./dist
USER node
ENTRYPOINT [ "pnpm", "run", "preview" ]
