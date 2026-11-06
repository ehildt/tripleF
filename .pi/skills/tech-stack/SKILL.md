---
name: tech-stack
description: Official documentation references and project stack guidance for the ckir.io/visions monorepo. Use before implementing, fixing, or refactoring features that touch Vue 3, NestJS, Node.js, Prisma, pnpm workspaces, Docker Compose, or related tools. Points to the correct skill for framework-specific conventions.
---

# Project Technology Stack

Use this skill before making framework-level changes so implementations follow official APIs and current best practices.

## Quick Rules

1. **Check the official docs first.** When a change involves Vue, NestJS, Node.js, Prisma, or another core tool, read the relevant official documentation before writing code.
2. **Use the right skill for the domain.** Framework-specific conventions live in dedicated skills; this file only provides the entry points and stack overview.
3. **Use project-native tooling.** Prefer pnpm workspace scripts, the Prisma CLI, the NestJS CLI, Vite, and Docker Compose. Do not install ad-hoc global tools to bypass workspace config.
4. **Do not modify lockfiles or workspace config without approval.** `pnpm-lock.yaml`, `pnpm-workspace.yaml`, and `package.json` changes require explicit user sign-off.
5. **Inspect dependency-command side effects.** After adding or removing packages, review the manifest, lockfile, and workspace definition together. Revert automatic changes such as release-age exclusions when they were not explicitly approved.
6. **Treat Compose startup and storage readiness as operational checks.** Follow the split-file startup order below, and verify infrastructure health plus a representative operation rather than assuming a running container is usable.

## Official Documentation

| Technology     | Purpose in this project                                                    | Link                                               |
| -------------- | -------------------------------------------------------------------------- | -------------------------------------------------- |
| Vue 3          | Frontend framework, Composition API, SFCs                                  | https://vuejs.org/guide/introduction.html          |
| NestJS         | Backend framework, modules, DI, controllers, services                      | https://docs.nestjs.com                            |
| Node.js        | Runtime, built-in modules, ES modules, security                            | https://nodejs.org/docs/latest/api/                |
| Prisma         | ORM, schema, migrations, client generation                                 | https://www.prisma.io/docs                         |
| pnpm           | Workspace package manager, scripts, lockfile                               | https://pnpm.io/workspaces                         |
| Docker Compose | Local development orchestration                                            | https://docs.docker.com/compose/                   |
| Vite           | Frontend build tooling, dev server                                         | https://vitejs.dev/guide/                          |
| Pinia          | Frontend state management                                                  | https://pinia.vuejs.org/introduction/              |
| Tailwind CSS   | Utility-first styling (note: project uses plain CSS tokens; see CSS skill) | https://tailwindcss.com/docs                       |
| Vitest         | Unit/integration testing for both workspaces                               | https://vitest.dev/guide/                          |
| Storybook      | Component stories and documentation                                        | https://storybook.js.org/docs                      |
| BullMQ         | Background job queues in the backend                                       | https://docs.bullmq.io/                            |
| KeyDB          | Redis-compatible store for BullMQ                                          | https://docs.keydb.dev/                            |
| RustFS         | S3-compatible object-storage server                                        | https://docs.rustfs.com/                       |
| AWS SDK for JavaScript v3 | S3 client adapter for the application boundary             | https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/ |
| PostgreSQL     | Primary relational database                                                | https://www.postgresql.org/docs/current/index.html |
| Fastify        | Underlying HTTP platform for NestJS                                        | https://fastify.dev/docs/latest/                   |

## Monorepo Layout

The repository root holds the workspace manifest (`package.json`), the workspace definition (`pnpm-workspace.yaml`), the lockfile (never edit by hand), and three Compose files: `compose.yml` for development apps, `compose.prod.yml` for production apps, and `infra.compose.yml` for backing services. Application workspaces live under `apps/server`, `apps/memory`, and `apps/dashboard`; published libraries live under `packages/*`.

## Local Development

- Create each application's env file from its committed example before the first start: server, memory, and dashboard.
- Install dependencies from the repository root with `pnpm install`.
- Start backing services with `docker compose -f infra.compose.yml up -d --wait` so PostgreSQL and RustFS are healthy before use.
- Push the server-owned Prisma schema with `pnpm --filter @triplef/server db:push`; the memory app never owns schema migration.
- Start application services with `docker compose up -d`. Bind-mounted sources provide hot reload for `apps/server`, `apps/memory`, and `apps/dashboard`.
- Do not use `--remove-orphans` during routine split-file startup. Both Compose files belong to the same project, so each invocation would otherwise treat the other file's containers as orphans and remove them.
- RustFS runs as a non-root user. Mount its named volume directly at `/data`, retain the explicit `/health/ready` healthcheck, and validate readiness plus a representative S3 operation after object-storage infrastructure changes. A nested mount point can be created with root ownership and prevent startup.
- Do not instruct a rebuild or restart for code-only changes under `apps/`.
- Only rebuild/restart when `Dockerfile`, `package.json` dependencies, or infra services change.

## Which Skill to Use

| Concern                                                    | Skill                        |
| ---------------------------------------------------------- | ---------------------------- |
| Vue components, composables, helpers, stories, tests       | [vue](../vue/SKILL.md)       |
| CSS tokens, scoped styles, design system                   | [css](../css/SKILL.md)       |
| NestJS modules, controllers, services, processors, helpers | [nestjs](../nestjs/SKILL.md) |
| ESLint, TypeScript, Prettier, depcheck, depcruise          | [lint](../lint/SKILL.md)     |
| Framework docs, project stack, official references         | tech-stack (this file)       |
| Framework-agnostic structure: naming, types placement, co-location, barrels | [code-structure](../code-structure/SKILL.md) |

## Checklist

- [ ] The official docs for the affected technology were reviewed before implementation
- [ ] Framework-specific conventions were checked in the relevant skill (`vue`, `css`, `nestjs`, `lint`)
- [ ] Workspace tooling was used instead of ad-hoc global installs
- [ ] Docker Compose commands respect the startup order, hot-reload guidance, and split-file orphan safety
- [ ] Dependency-command side effects were reviewed and no unapproved workspace config changed
- [ ] Object-storage changes were checked through readiness and a representative live operation
- [ ] Lockfiles and workspace config were left untouched unless explicitly approved
