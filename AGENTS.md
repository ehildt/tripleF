# ckir.io/visions — Project Guide

## Project Overview

This is a TypeScript monorepo for ckir.io/visions, an AI-powered image analysis microservice.

- `server/` — NestJS backend with Fastify, Prisma/PostgreSQL, BullMQ/KeyDB, MinIO.
- `dashboard/` — Vue 3 frontend with Vite, Pinia, Tailwind, Storybook, Vitest.

## Monorepo & Tooling

- Package manager: pnpm workspaces.
- Local orchestration: Docker Compose.
  - Infra: `docker compose -f infra.compose.yml up -d` (postgres, minio, keydb).
  - App: `docker compose up` (server + dashboard with hot reload via bind mounts).
- Quality gates: ESLint, TypeScript, Prettier, `depcheck`, `depcruise`, `ts-unused-exports`.
- Tests: Vitest in both workspaces.

## Available Skills

Use the relevant skill before implementing framework-specific changes:

- `vue` — Vue components, composables, helpers, stories, tests.
- `css` — Styling, design tokens, scoped CSS.
- `nestjs` — NestJS modules, controllers, services, processors, helpers, DTOs.
- `lint` — ESLint, TypeScript, depcheck, depcruise.
- `tech-stack` — Official docs links and project stack overview.

## Working Rules

Agent behavior, planning protocol, dev-environment guidance, and implementation rules live in `.pi/APPEND_SYSTEM.md`. Follow those instructions for every task.

## Tone & Collaboration

- Do not argue with the user. The user is not interested in blame or whose fault a problem is.
- If a pre-existing error, inconsistency, or broken state exists, treat it as leftover context from a previous session and move forward.
- Focus on understanding the current request and fixing or improving the project, not on explaining why something went wrong.
- Keep responses concise and actionable.

## Safety & Secrets

- Never hardcode credentials, API keys, or secrets in source files.
- Leave existing `.env` files untouched unless explicitly asked to modify them.
- Do not commit secrets or environment files.
