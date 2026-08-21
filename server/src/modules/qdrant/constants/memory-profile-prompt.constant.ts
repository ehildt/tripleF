/**
 * Prompt for the memory-profile queue job — after a turn has been answered,
 * the model maintains its own memory of THIS user in the memory_cognition
 * space: ONE structured profile document (stable identity and durable traits)
 * plus any new derived INSIGHTS (topic-specific understanding recalled later
 * by embedding probe when the conversation touches their topics).
 *
 * Structured output enforced by contract: the job parses the answer with the
 * tolerant LLM-JSON parser and validates it against memoryProfileResponseSchema
 * — so the instructions below carry the exact JSON shape. The emitted
 * `profile` is a PATCH merged over the stored document in code: fields the
 * patch omits survive, null-valued fields are removed, and `profile: null`
 * keeps the existing document (nothing durable learned).
 */
export const MEMORY_PROFILE_INSTRUCTIONS = `COGNITION JOB — maintain YOUR evolving understanding of THIS user.

You hold two kinds of cognition, both derived (never the fact store):
1. PROFILE — a single structured JSON document of who the user is: stable identity and durable LEAN topics. You output a PATCH, never the whole document — your fields are MERGED into the stored profile in code: fields you OMIT are kept as stored, fields you set REPLACE the stored value, and a field set to null REMOVES it from the profile ("likes": null deletes the whole list). Never repeat unchanged fields, and never null a field you merely do not know — null deletes. The profile is a ROUTING MAP: its values are short topic strings ("cars", "Linux", "TypeScript") that double as probe triggers into your deeper insight memory — keep each value to a phrase, never a sentence; depth does not belong here.
2. INSIGHTS — the DEPTH behind those topics: specific models they like, past statements, working nuances — recalled later by vector probe when that topic comes up. One self-contained sentence each, third person, lead with the topic. When an insight deepens a stored profile value, attach its "path" as "field.keyword" where the keyword names THAT value exactly — short, never a phrase (profile likes "anime" → "likes.anime"); genuinely general insights stay pathless.

You receive:
- USER REQUEST: what the user asked this turn.
- ASSISTANT RESPONSE: what you answered (prose only).
- CURRENT PROFILE: your document so far (may be empty).
- DERIVED INSIGHTS: your deeper memory of this user, already stored (may be absent).
- PRIOR FACTS: this user's OWN stored statements from past conversations, probed by this turn's topic (may be absent).

Rules:
- Evidence only: record ONLY what this payload supports — USER REQUEST, ASSISTANT RESPONSE, CURRENT PROFILE, DERIVED INSIGHTS. Never guess or invent attributes (name, language, timezone, expertise, likes, interests, goals …) the turn did not state or clearly imply; a value you do not know is an OMISSION, never a null and never a guess.
- Derive, don't transcribe: durable characteristics, goals, preferences, expertise, communication style. Never one-off moods, task content, or facts already covered by memory records.
- Third person ("The user …"), compact values, no markdown.
- Never store secrets, credentials, or sensitive data the user did not explicitly ask to be remembered.
- DERIVED INSIGHTS are your already-stored depth. When one holds a durable trait that belongs in the routing map (a language, a standing interest, a skill, a preference), promote it into the profile as a SHORT topic string — never copy insight sentences into the profile; depth stays in the insights.
- Connect, never collapse: PRIOR FACTS may echo or complete what this turn reveals. When a new detail plausibly connects to a prior fact (the user disliked the dog food they bought AND you know they own a dog), you MAY record the CONNECTION as a derived insight — hedged, third person, plainly tentative ("… — possibly because the dog refuses it"). Never merge two facts into one claim the user never made, never store the connection as a stated fact, and never let a connection invent or replace a profile value.
- The MERGED profile (the stored document with your patch applied) must stay under the stated character cap — when headroom shrinks, reclaim space by removing the least-durable fields (set them to null) instead of piling on.
- Null means the user explicitly no longer holds that trait ("likes": null after they said they stopped liking X) — never null a field you merely do not know, and never answer with an all-nulls profile: deleting EVERYTHING you know is always a mistake on a normal turn.
- If the turn revealed nothing durable, answer with profile null and an empty insights array.

Respond with EXACTLY one JSON object, nothing else:
{
  "profile": {
    "name": "… (optional)",
    "language": "… (optional, e.g. 'en')",
    "timezone": "… (optional, e.g. 'Europe/Berlin')",
    "expertise": ["…"],
    "goals": ["…"],
    "communication": { "style": "…", "detailLevel": "…", "formality": "…" },
    "preferences": { "…": "…" },
    "likes": ["…"],
    "dislikes": ["…"],
    "interests": ["…"]
  },
  "insights": [{ "text": "…", "path": "likes.cars" }]
}
- profile: ONLY the fields you are adding, refining, or removing (removal = a null value), or null when nothing durable changed.
- Arrays (expertise, goals, likes, dislikes, interests): when you change one, re-emit its COMPLETE new contents — a partial array REPLACES the stored list and drops whatever you omitted.
- insights: only NEW durable depth (omit when none); "path" is optional and only when the insight deepens a profile value.`;

/**
 * Assembles the turn payload the cognition job reasons over. Truncation
 * keeps the job cheap: derived traits need salience cues, not full payloads.
 */
export function buildMemoryProfilePrompt(params: {
  userRequest: string;
  assistantResponse?: string;
  currentProfile?: string;
  /** The space's derived insights — the depth behind the profile's topics. */
  insights?: Array<{ text: string; path?: string }>;
  /**
   * The user's own stored fact statements probed by this turn — the
   * connective tissue for cross-conversation (derived, hedged) insights.
   */
  priorFacts?: Array<{ text: string }>;
  limit: number;
}): string {
  const parts = [
    `USER REQUEST: ${params.userRequest.slice(0, 1500)}`,
    `ASSISTANT RESPONSE: ${(params.assistantResponse?.trim() || '(no response text)').slice(0, 1500)}`,
    `CURRENT PROFILE: ${params.currentProfile?.trim() || '(nothing learned yet)'}`,
  ];
  const insights = params.insights
    ?.map((insight) =>
      insight.path ? `[${insight.path}] ${insight.text}` : insight.text,
    )
    .join('\n')
    .slice(0, PROFILE_INSIGHT_SECTION_LIMIT);
  if (insights) {
    parts.push(
      `DERIVED INSIGHTS (your deeper memory — promote durable topics from here into the profile):\n${insights}`,
    );
  }
  const priorFacts = params.priorFacts
    ?.map((fact) => `- ${fact.text}`)
    .join('\n')
    .slice(0, PROFILE_FACTS_SECTION_LIMIT);
  if (priorFacts) {
    parts.push(
      `PRIOR FACTS (this user's own past statements, probed by this turn — connect, never collapse):\n${priorFacts}`,
    );
  }
  parts.push(
    `CHARACTER CAP: the merged profile (the stored document plus your patch) must stay under ${params.limit} characters — prune with nulls before you run out of room.`,
    MEMORY_PROFILE_VERDICT,
  );
  return parts.join('\n\n');
}

/** Bounded insight section in the job prompt — salience cues, not a dump. */
const PROFILE_INSIGHT_SECTION_LIMIT = 1500;

/** Bounded prior-facts section in the job prompt — connective cues, not a dump. */
const PROFILE_FACTS_SECTION_LIMIT = 1500;

const MEMORY_PROFILE_VERDICT =
  'Decide: output the JSON object now — the profile patch (or null when unchanged) plus any new insights.';
