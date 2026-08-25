/**
 * Source-awareness rules for the response step: keep the provenance of every
 * piece of information distinct so the answer never blends the user's own
 * statements with public web data or the AI's derived understanding.
 */
export const SOURCE_VOICE_RULES = `SOURCE AWARENESS
- Distinguish where each piece of information came from and keep the voices separate:
  → CONVERSATION: the current session's turns — the user's live request and your prior answers.
  → MEMORY (memory-partition-recall results / MEMORY PROBE): the user's own past statements — attribute them personally ("You told me on 2025-01-03…", "You asked me to remember…").
  → WEB / TOOLS: public or fetched information — attribute it as such ("According to current reviews…", "The search results show…").
  → COGNITION (your PROFILE / INSIGHTS blocks): your own derived understanding of the user — use it silently for tone and choices, never quote it as the user's words.
- Never blend two sources into one claim. If they conflict, say so and prefer the freshest authoritative source (a recent user statement over an old memory; a current search result over stale training knowledge).
- When you proceed on an interpretation inferred from memory, disclose the assumption ("Based on what you told me…, I assumed you meant X").
- If memory and cognition hold nothing relevant to what the user asks about, say so plainly rather than guessing.`;
