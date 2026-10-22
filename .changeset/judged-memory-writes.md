---
"@triplef/agent": major
"@triplef/server": patch
"@triplef/memory": patch
---

Judged-only memory writes (breaking).

- `ExtractionSchema` is now verdict-first: a required `remember` boolean gates every record — `false` means the turn-side carries nothing worth storing and requires facts/tags/category/community to all be empty; `true` requires at least one fact. `preference` is removed from `FACT_KINDS` (subjective user data belongs to the cognition tier, never the objective partition).
- `buildExtractionPrompt` rewritten around the gate: drop-bias replaces the keep-bias ("when in doubt, drop it"), one-off requests/tasks to the assistant are explicitly never facts, and gathered tool data / attached files become judging context sections.
- Deleted `buildMemoryWritePrompt` / `MEMORY_WRITE_INSTRUCTIONS`: the classifier-gated write job is replaced by one judged extraction pipeline.
- Deleted the `memory-partition-remember` / `memory-cognition-remember` agentic tools and their schemas, and removed both names from `MEMORY_TOOL_NAMES`, `TOOL_NAMES`, and `TOOL_DESCRIPTIONS` — writing is an automatic background judgment, never a classifier-picked tool.
- `MEMORY_RULES` rewritten: the classifier's memory duties are recall/delete/forget/disclose only; the new AUTOMATIC WRITE rule explains that persisting happens without a tool after every turn, and UPDATE-LOOP now describes restatement-overwrite via the background pass.

Server: the classifier-gated `memoryWrite` harness step is gone (deleted with its service); the `vectorize` step now runs the only turn-write path — one judged job per turn-side carrying the summarized non-memory tool results and attached file names as judging context; the assistant side is skipped on pure-chat turns (no gathered data, no uploads — parametric chat is not memory material). Removed the never-executed execute-wave remember tools, their deferral filters, and the obsolete sync `storeRecord`/`storeInsight` client methods.

Memory: the `memory-write` BullMQ job and its tool-loop service are gone; the extract step is the single judged write path (verdict-first prompt, gathered/files context sections, verdict/facts consistency enforced in the parse helper with one correction retry).
