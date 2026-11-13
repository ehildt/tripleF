# NestJS Prisma Convention

**Required when changing Prisma schema, generation, migration, or build integration.** Official reference: [Prisma documentation](https://www.prisma.io/docs).

## Ownership

The server owns the Prisma schema and its migration workflow. The memory application never owns schema migration. Generated Prisma client code is generated output and is never hand-edited or refactored as application source.

Schema changes, client generation, and runtime verification are separate concerns. A successful type-check alone does not prove that the generated client or database schema matches the intended environment.

## Workspace commands

Use the server's existing package scripts rather than ad-hoc global tools:

- `pnpm --filter @triplef/server db:generate` generates the client through the server's configured environment.
- `pnpm --filter @triplef/server db:push` pushes the server-owned schema.
- `pnpm --filter @triplef/server db:migrate` runs the development migration workflow.
- `pnpm --filter @triplef/server db:migrate:prod` deploys production migrations.
- `pnpm --filter @triplef/server db:studio` opens the database inspection tool.

The scripts load the server's Prisma environment through their committed configuration. Do not edit existing environment files unless explicitly asked and never expose credentials in source or output.

## Startup and schema order

Start backing infrastructure with the documented wait for readiness before pushing the schema. PostgreSQL must be healthy, not merely started. Then run the server-owned schema operation and start the application stack.

After infrastructure or schema changes, verify readiness and a representative database operation rather than assuming that a running container or successful command proves usability.

## Build and type-check interaction

The server build has a prebuild generation step and uses the server's Prisma environment. A build can therefore require environment configuration even when a pure TypeScript check does not exercise the same generation path.

Use the existing server build script when build verification is required. Do not bypass generation, alter workspace configuration, or weaken release and install policy to make the build pass.

Do not hand-edit generated exports to silence dead-code or dependency diagnostics. Investigate the generator and actual consumer boundary instead.

## Completion checklist

- Schema and migration ownership remain with the server only.
- Existing filtered package scripts and configured environment are used.
- Infrastructure is ready before schema operations.
- Generated client output is never hand-edited.
- Build versus type-check behavior is reported accurately.
- A representative database operation verifies the resulting schema when applicable.
