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
| MinIO          | S3-compatible object storage                                               | https://min.io/docs/minio/linux/index.html         |
| PostgreSQL     | Primary relational database                                                | https://www.postgresql.org/docs/current/index.html |
| Fastify        | Underlying HTTP platform for NestJS                                        | https://fastify.dev/docs/latest/                   |

## Monorepo Layout

```
.
├── package.json              # Root workspace manifest
├── pnpm-workspace.yaml       # Workspace definition
├── pnpm-lock.yaml            # Lockfile (do not edit manually)
├── compose.yml               # App services (server, dashboard)
├── infra.compose.yml         # Infra services (postgres, minio, keydb)
├── server/                   # NestJS backend
│   ├── package.json
│   ├── prisma/
│   └── src/
└── dashboard/                # Vue 3 frontend
    ├── package.json
    └── src/
```

## Local Development

- Start infrastructure: `docker compose -f infra.compose.yml up -d`
- Start app services: `docker compose up` (bind-mounted volumes provide hot reload for `server/` and `dashboard/`)
- Do not instruct a rebuild or restart for code-only changes in `server/` or `dashboard/`.
- Only rebuild/restart when `Dockerfile`, `package.json` dependencies, or infra services change.

## Which Skill to Use

| Concern                                                    | Skill                        |
| ---------------------------------------------------------- | ---------------------------- |
| Vue components, composables, helpers, stories, tests       | [vue](../vue/SKILL.md)       |
| CSS tokens, scoped styles, design system                   | [css](../css/SKILL.md)       |
| NestJS modules, controllers, services, processors, helpers | [nestjs](../nestjs/SKILL.md) |
| ESLint, TypeScript, Prettier, depcheck, depcruise          | [lint](../lint/SKILL.md)     |
| Framework docs, project stack, official references         | tech-stack (this file)       |

## Checklist

- [ ] The official docs for the affected technology were reviewed before implementation
- [ ] Framework-specific conventions were checked in the relevant skill (`vue`, `css`, `nestjs`, `lint`)
- [ ] Workspace tooling was used instead of ad-hoc global installs
- [ ] Docker Compose commands respect the hot-reload guidance
- [ ] Lockfiles and workspace config were left untouched unless explicitly approved
