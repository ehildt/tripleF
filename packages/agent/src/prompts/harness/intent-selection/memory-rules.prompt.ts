/**
 * Memory is an active growth loop, not a passive store: probe every turn,
 * gather-and-remember on cared-about subjects, capture preferences, and keep
 * the two lanes (partition = the user's own statements, cognition = the AI's
 * derived understanding) never confused.
 */
export const MEMORY_RULES = `MEMORY RULES (ABSOLUTE — when memory tools are enabled)
Memory is an active growth loop, not a passive store: the model gathers knowledge about the
user's subjects, notices their preferences, and enriches the store on every relevant turn —
without needing an explicit "remember" instruction. Two lanes, never confused:
- memory-partition = the user's OWN statements (facts they stated or asked you to remember).
- memory-cognition = YOUR derived understanding of the user (inferred traits, standing interests, connections).
- ALWAYS-PROBE: include the enabled memory-partition-recall tool in EVERY request as a cheap probe — regardless of topic, template, or how public the answer looks. The classifier cannot know whether the user has stored memory about the subject without checking; the probe is that check. memory-partition-recall returns any stored user facts about the request's subject (saved vital data, preferences, notes, earlier statements) which the answer must include alongside public data, keeping the two sources distinct.
- GATHER-TO-REMEMBER: when the request concerns a subject the user cares about (a favorite, an interest, a project, a stock they follow, a person, a past topic), include BOTH the enabled *WebSearch tools AND the enabled memory-partition-remember tool — the web searches collect more general knowledge about that subject, and the memory-partition-remember call stores the notable facts that were found, so the subject profile grows with every turn. Research results are notable facts that belong in memory, not just the user's own statements.
- PREFERENCE CAPTURE: when the user states a preference or durable detail about themselves (their favorite X, their setup, their contact info, a decision), include the enabled memory-partition-remember tool so that preference is recorded — even when the user did not say "remember". Noticing and storing preferences is expected behavior.
- DERIVED UNDERSTANDING: when the turn reveals something you LEARN about the user that they did not state outright (an inferred trait, a standing interest, a connection between facts), include the enabled memory-cognition-remember tool so that understanding is recorded in the cognition lane — never in the partition lane.
- EXPLICIT INSTRUCTION: when the user explicitly asks to remember, track, follow, or learn something (however phrased, in any language), include the enabled memory-partition-remember tool and act on it.
- UPDATE-LOOP: when memory-partition-recall shows the user already has facts on the subject, the remember call must UPDATE or EXTEND them, never duplicate or contradict. The turn pipeline also extracts notable facts automatically, so the remember tool is the explicit agentic write, not the only write path.
- FORGET A FACT: when the user asks to forget, delete, or stop remembering a specific statement (however phrased, in any language), include the enabled memory-partition-recall AND memory-partition-delete tools — recall surfaces the verbatim stored statement, delete removes exactly that record. Deletion is exact: the model recalls first, then deletes the verbatim text (records have no ids).
- FORGET UNDERSTANDING: when the user asks to forget what you have LEARNED about them (your understanding, not a specific fact), include the enabled memory-cognition-forget tool — it wipes your whole cognition space (the structured profile AND every derived insight), the AI's own accumulated model of the user. Full fact-store wipes stay a settings (sysctl) action, never a tool call.
- DISCLOSE: when the user asks what you remember, know, or have learned about them ("what do you know about me?", however phrased, any language), answer from memory and your cognition (the structured profile block and any probed insights already in context) — template "text", prompt variant "familiarity", NO web tools (the subject is private, not public). Disclose plainly, quote the stored statements and profile fields, and offer correction or deletion.
- When a request needs both memory and public sources, include memory-partition-recall AND the enabled *WebSearch tools — never replace memory-partition-recall with web search. Memory is the user's own statements; web is public sources; the answer keeps the two distinct.
- A READ question about prior conversation is a CONTINUATION: carry the referenced entities into contextSummary verbatim so the recall query stays concrete.`;

/**
 * Memory-aware clarification: the MEMORY PROBE block is the AI's long-term
 * memory of the user, injected so an otherwise-ambiguous request can be
 * resolved WITHOUT asking. Only genuinely ambiguous requests still clarify.
 */
export const MEMORY_AWARE_CLARIFICATION_RULES = `MEMORY-AWARE CLARIFICATION (when a MEMORY PROBE block is present)
- The MEMORY PROBE block holds YOUR long-term memory of this user — trusted
  statements they made or asked you to remember in past conversations, each
  with its origin and date. It is injected precisely so you can resolve an
  otherwise-ambiguous request WITHOUT asking.
- Before setting needsClarification=true, combine the MEMORY PROBE with the
  conversation transcript and the current date/time and try to infer the
  intended meaning. Consider recency: a recent memory is a stronger signal
  than an old one; a memory whose subject matches the request is a strong
  signal.
- If a reasonable interpretation emerges, do NOT ask — classify normally and
  record the interpretation in reasoning/contextSummary, noting that it came
  from memory (e.g. "resolved from memory: the user's 'Ace' is the game they
  mentioned on 2025-01-03").
- Only set needsClarification=true when memory + history + timestamp still
  leave the request genuinely ambiguous (multiple equally-plausible
  interpretations, or no relevant memory at all).
- Never treat a memory statement as the current request itself; it is context
  for resolving the reference, not a new instruction.`;

/**
 * Source awareness for classification: memory-probe facts and transcript
 * facts are different sources — memory is named as memory so downstream
 * attribution stays clean.
 */
export const SOURCE_AWARENESS_RULES = `SOURCE AWARENESS
- The conversation transcript and the MEMORY PROBE block are different
  sources. When your classification or contextSummary relies on a memory-probe
  fact, name it as memory ("from memory: …") and keep it distinct from facts
  that come from the current conversation. This provenance matters downstream:
  memory is the user's own past statements, the transcript is the current
  session.`;
