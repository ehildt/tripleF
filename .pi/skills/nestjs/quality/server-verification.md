# Server Verification

Use this document for approved test work and runtime verification after server changes.

## Consent and existing tests

Creating or updating `.spec.ts`, `.test.ts`, or `.stories.ts` files requires explicit user consent. Do not add them speculatively during implementation. After implementation, ask the user to verify behavior manually; once confirmed, offer tests as a separate step.

Existing tests are a regression net, so run those covering touched code and report failures. They are also a contract rather than infallible proof: code and tests can drift, and neither a failing nor passing result should be trusted blindly. Investigate both sides.

When a change would break an existing test, stop and report before modifying either implementation or test.

## Co-located coverage

When specs exist or their creation is approved:

- Every helper has a co-located `.helper.spec.ts` that directly exercises input and output.
- Each file exporting logic has a co-located `.spec.ts` appropriate to its behavior.
- Entry-point specs verify validation, routing, and delegation rather than domain outcomes.
- Service specs verify owned domain decisions, failure semantics, and side effects.
- Processor specs verify job-type routing and service delegation.
- Module structure still requires runtime verification regardless of unit-test coverage.

Moving a unit includes moving its approved coverage and updating direct imports without forwarders.

## Runtime graph verification

Type-check, lint, and unit tests can all pass while NestJS DI wiring is broken or duplicate module registrations create duplicate routes. After any module-structure change:

1. Start the Compose server stack using the documented development workflow.
2. Confirm the server boots cleanly with no dependency-resolution failure or duplicated route.
3. Exercise representative routes affected by the module graph.
4. Report exact boot or route failures and do not claim verification from static gates alone.

Prisma-backed verification additionally follows [Prisma](../conventions/prisma.md), including infrastructure readiness and a representative database operation when schema or generated-client behavior changed.

## Completion checklist

- Consent exists for every created or updated test or story artifact.
- Existing relevant tests ran and failures were investigated and reported.
- Helper, logic-unit, entry-point, service, and processor coverage matches its ownership boundary.
- Module changes include a clean server boot and representative route responses.
- Prisma changes include their required readiness and database verification.
- Manual verification or remaining unverified behavior is reported explicitly.
