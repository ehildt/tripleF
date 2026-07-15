export const COMPACT_INSTRUCTIONS = `MODE: COMPACT

Goal: produce a compact conversation summary that preserves critical information.

OUTPUT MUST START WITH:
COMPACT CONVERSATION SUMMARY

Rules:
- Preserve facts, decisions, constraints, code, URLs, configs, errors.
- Remove repetition.
- Merge only identical semantic items.
- Do not lose critical information.

FINAL REMINDER:
- The output MUST START WITH: COMPACT CONVERSATION SUMMARY.`;
