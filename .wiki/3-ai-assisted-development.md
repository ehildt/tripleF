# 3. AI-Assisted Development & Code Ownership

tripleF is built fast, and it is built deliberately. This page is the honest account of how — and the rule that makes the speed sustainable.

## The paradigm: context coding

Generative AI tools are part of the daily loop in this repository. We call the working method **context coding**: the model operates _inside_ the project's documented context — conventions, skills, architecture decisions — and produces drafts; **humans own every decision that ships**.

Context coding is not "vibe coding":

|                | Vibe coding            | Context coding (this project)                                   |
| -------------- | ---------------------- | --------------------------------------------------------------- |
| Input          | A prompt and hope      | Documented conventions (`AGENTS.md`, `.pi/skills/*`, this wiki) |
| Output         | Whatever compiles      | Drafts reviewed against explicit rules                          |
| Architecture   | Discovered by accident | Decided by humans, enforced by linters and dependency rules     |
| Responsibility | Nobody's               | The committer's, always                                         |
| Compounding    | Entropy                | Velocity                                                        |

## Where AI actually helps here

- **Pattern-consistent boilerplate** — composables, DTOs, controllers, Vitest specs follow strict shapes; generating them inside the documented pattern is nearly free.
- **Exploration with receipts** — comparing documented APIs, verifying framework behaviour (e.g. pnpm workspace semantics, NestJS module patterns) against official sources before touching code.
- **Refactors with wide blast radius** — mechanical changes across dozens of files with the same rule, individually verified.
- **Docs like this wiki** — drafted against the actual code, then checked by the people who wrote the code.

## Where humans are non-negotiable

1. **Interfaces and contracts.** The harness step engine, the socket event contract, the DLQ schema, the REST surface — designed and reviewed by humans. A model can sketch; it cannot own a contract.
2. **Failure modes.** Retry behaviour, cancellation semantics, crash recovery ("what happens when KeyDB restarts mid-stream?") are decided by reasoning about operations, not by generating plausible code.
3. **Dependency and security decisions.** What enters `package.json`, what runs with which permissions, how secrets flow — human calls, every time.
4. **Final review.** Nothing merges that a human did not read and would not defend in an incident review.

## The guardrails that make it stick

- **Quality gates in CI on every branch:** ESLint, `vue-tsc`/tsc, Vitest, dependency-cruiser (architecture rules), `ts-unused-exports`, `depcheck`.
- **Conventions as machine-readable context:** `AGENTS.md`, `.pi/skills/` (Vue, CSS, NestJS, lint, tech-stack) instruct any contributor — human or machine — about the same house rules.
- **Documentation-first:** this wiki is written _for_ both audiences; new subsystems get documented when they land.
- **Small, reviewable changes:** agents produce diffs, humans accept or reject; no generated bulk rewrites without explicit approval.

## The uncomfortable truth, stated plainly

Velocity without ownership accelerates directly into technical insolvency. AI-assisted output merges at the speed of review, not at the speed of generation. If a change cannot be explained, tested, and debugged by the person merging it, it does not belong in the tree — regardless of how it was produced.

tripleF treats AI the way it treats open models generally: a force multiplier under human command, never the commander.
