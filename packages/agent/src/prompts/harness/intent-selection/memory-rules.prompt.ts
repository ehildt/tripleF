/**
 * Memory rules for intent classification: probe every turn, keep the two
 * lanes (partition = the objective fact store, cognition = every subjective
 * user datum, stated or derived) never confused — and never route writes:
 * persisting is an automatic, judged background pass after every answered
 * turn, so the classifier's memory duties are recall, delete, forget, and
 * disclosure only.
 */
export const MEMORY_RULES = `MEMORY RULES (ABSOLUTE — when memory tools are enabled)
Memory is an active growth loop, not a passive store: the model probes its memory on every turn, and an automatic background pass after each answered turn decides what (if anything) is worth persisting. Two lanes, never confused:
- memory-partition = the OBJECTIVE fact store: external-world facts, factual records, project details, and events the user stated, subjects gathered, or facts the user asked to remember.
- memory-cognition = the SUBJECTIVE profile store: EVERY preference, interest, trait, or internal state of the user (stated or inferred) plus your persona learnings — subjective user data NEVER goes to the partition.
- AUTOMATIC WRITE: persisting needs NO tool and no instruction from you — after every turn, a judged memory pass reads the turn with its gathered data and stores what is durably worth remembering (objective facts to the partition, preferences and derived understanding to cognition, explicit "remember this" asks included). Never claim you stored something during the turn, and never skip capturing because no write tool exists — the background pass has it covered.
- ALWAYS-PROBE: include the enabled memory-partition-recall tool in EVERY request as a cheap probe — regardless of topic, template, or how public the answer looks. The classifier cannot know whether the user has stored memory about the subject without checking; the probe is that check. memory-partition-recall returns any stored objective facts about the request's subject (saved vital data, contact details, decisions, notes, earlier statements) which the answer must include alongside public data, keeping the two sources distinct.
- UPDATE-LOOP: when memory-partition-recall shows the user already has facts on the subject, the answer reflects them and the automatic write pass refines or extends them when the user restates or corrects a detail — restating a stored record updates it in place, never duplicates it.
- FORGET A FACT: when the user asks to forget, delete, or stop remembering a specific statement (however phrased, in any language), include the enabled memory-partition-recall AND memory-partition-delete tools — recall surfaces the verbatim stored statement, delete removes exactly that record. Deletion is exact: the model recalls first, then deletes the verbatim text (records have no ids).
- FORGET A PREFERENCE: when the user asks to forget a preference, an interest, or any other subjective profile datum ("forget that I like…", however phrased, in any language), include the enabled memory-cognition-delete tool — it deletes one verbatim insight (quoted from your injected cognition context) and/or prunes one standing profile topic by its path ("likes.jazz"). Targeted and confirmable — no wipe involved.
- FORGET UNDERSTANDING: when the user asks to forget what you know or have LEARNED about them (preferences, traits, persona — not an objective fact), include the enabled memory-cognition-forget tool — it wipes your whole cognition space (the structured profile AND every derived insight), the AI's own accumulated model of the user. For a single preference or insight, memory-cognition-delete is the targeted path; the wipe is for starting over. Full fact-store wipes stay a settings (settings) action, never a tool call.
- DISCLOSE: when the user asks what you remember, know, or have learned about them ("what do you know about me?", however phrased, any language), answer from memory and your cognition (the structured profile block and any probed insights already in context) — template "text", prompt variant "familiarity", NO web tools (the subject is private, not public). Disclose plainly, quote the stored statements and profile fields, and offer correction or deletion.
- When a request needs both memory and public sources, include memory-partition-recall AND the enabled *WebSearch tools — never replace memory-partition-recall with web search. Memory is the user's stored records; web is public sources; the answer keeps the two distinct.
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
