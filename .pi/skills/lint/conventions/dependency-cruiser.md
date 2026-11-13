# Dependency Cruiser Convention

**Required when investigating dependency-graph violations.** Official reference: [dependency-cruiser](https://github.com/sverweij/dependency-cruiser).

Run `pnpm depcruise` from `apps/dashboard/` or `apps/server/`, or use the corresponding filtered command. The workspace script uses its dependency-cruiser configuration and TypeScript project against `src`.

## Interpret violations by ownership

Circular warnings in generated Prisma files are expected generated-code behavior. Do not refactor generated files to remove them.

Circular warnings in application code require a real ownership correction: invert the dependency, move shared symbols to their proper owner, or collapse a false abstraction. Do not suppress the rule or move the cycle into a barrel.

Orphan reports require checking whether the file is genuinely disconnected or is discovered dynamically through an entry point or registry. Inspect actual application discovery before deleting it.

A `not-to-dev-dep` error means production source imports a development dependency. Move the package to production dependencies through the approved package workflow or isolate the import into development-only code. Do not hide the edge through configuration.

## Completion checklist

- The workspace's configured graph command ran against real source.
- Generated-code warnings were not used as a reason to edit generated output.
- Application cycles have an ownership-based resolution.
- Dynamic entry points and registries were checked before treating a file as orphaned.
- Production-to-development violations are resolved by actual dependency or import ownership.
