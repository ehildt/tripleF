# Unused Export Convention

**Required when investigating dead-export reports.** Official reference: [ts-unused-exports](https://github.com/pzavolinsky/ts-unused-exports).

Run `pnpm lint:unused` inside `apps/dashboard/` or `apps/server/`. The script analyzes the workspace's `tsconfig.exclude.json` and enforces the configured issue limit.

## Investigate before deleting

Generated code such as Prisma output and public or internally consumed type exports can appear in the report. Never delete or edit generated exports to silence the tool.

For hand-written code, trace actual importers and public ownership. Remove an unused export or use it where the public contract genuinely requires it. A type referenced only inside its own declaration file should not be exported merely for hypothetical reuse.

If a symbol must remain part of a real public contract, connect it to that intentional consumer boundary. Do not add a barrel or proxy re-export solely to make the report disappear.

A missing or extra tsconfig selection can create misleading output. Confirm the analyzed project includes the intended source before treating the result as authoritative.

## Completion checklist

- The correct `tsconfig.exclude.json` and source scope were analyzed.
- Generated exports remain untouched.
- Hand-written exports were traced to actual consumers and removed or justified.
- No barrel, proxy export, or artificial usage was added to silence the report.
- Remaining intentional public surface has an explicit ownership reason.
