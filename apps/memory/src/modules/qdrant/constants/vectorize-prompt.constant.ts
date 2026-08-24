/** Static prompt strings for the vectorize extraction LLM step. */

/**
 * Structured output contract + task for the extraction model. Mirrors the
 * harness's `buildStructuredJsonPrompt` conventions: the schema is described
 * as text (the zod template in templates/extraction.schema.ts is the typed
 * truth), followed by the task rules and a final reminder.
 */
export function buildExtractionPrompt(): string {
  return `OUTPUT FORMAT — output ONLY valid JSON matching this exact schema:
{
  "facts": ["durable, self-contained fact worth remembering later"],
  "tags": ["short lowercase topic label"]
}

YOUR TASK — decide what is worth remembering:
- A fact is durable information that remains useful in a later, unrelated conversation: user preferences, decisions, contact details, project facts, technical constraints (e.g. "User prefers single-line if statements", "Sam's phone number is 555-1234", "User is building a vector memory feature").
- Facts must be self-contained — no "this"/"that" references; write them as third-person statements.
- Storage mechanics: each fact is embedded as a whole and matched sentence-by-sentence at recall time (multi-variant retrieval). One dense sentence is fine — put the subject up front ("User prefers single-line if statements", not "They prefer that style").
- Skip transient content: greetings, small talk, one-off instructions, filler — anything with no future recall value. When in doubt, leave it out.
- Tags: 2 to 6 stable, reusable, lowercase topic labels describing what the text is about (e.g. "work", "rust", "contacts"). They are the vocabulary for topic-filtered recall later.
- If nothing durable is found, return an empty facts array; tags may still label the topic when useful.

PRIOR MEMORY (when the user message ends with an "ALREADY STORED IN MEMORY" section):
- That section lists facts already stored in YOUR long-term memory from prior turns. NEVER emit a fact already covered there.
- If this turn refines, corrects, or completes a stored fact, DO emit it — as one fuller, self-contained restatement (a full restatement of the corrected claim overwrites the old record in place; it is never a diff).
- A statement that flips or adds negation to a stored fact is NEW information — always emit it.
- Everything not covered by the section is extracted as usual.

RULES:
- Return ONLY a single valid JSON object matching the exact schema above.
- No markdown code fences, no explanations, preamble, or postscript.
- Never output undefined or null. Both keys are always present (empty array when none applies).

FINAL REMINDER:
- Output ONLY valid JSON matching the exact schema above. No markdown code fences, no explanations, preamble, or postscript.`;
}

/**
 * JSON correction prompt for when the model's memory extraction could not be
 * parsed at all (empty output or output that fails the extraction schema).
 * Mirrors the harness's `buildIntentCorrectionPrompt` shape.
 */
export function buildExtractionCorrectionPrompt(error: string): string {
  return `Your previous response was not valid.
Error: ${error}

Return ONLY a single valid JSON object matching the extraction schema exactly:
{"facts": [string, ...], "tags": [string, ...]}
All object keys must be quoted with double quotes.
Do not add markdown code fences, explanations, or extra text.

FINAL REMINDER:
- Return ONLY a single valid JSON object. No markdown code fences, no explanations, no extra text.`;
}
