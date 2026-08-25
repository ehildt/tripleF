import { limitText } from '@triplef/helpers/limit-text';

import { memoryProfileResponseSchema } from '../../schemas/index.js';
import { buildStructuredPrompt } from '../helpers/build-structured-prompt.helper.js';

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
export const MEMORY_PROFILE_INSTRUCTIONS = buildStructuredPrompt(memoryProfileResponseSchema, {
  before: `COGNITION JOB — maintain YOUR evolving understanding of THIS user.

You hold three kinds of cognition, all derived (never the fact store):
1. PROFILE — a single structured JSON document: who the user is (stable identity and durable LEAN topics) PLUS your own persona (the name, role, and voice the user has given YOU) and your learned corrections (behavioral rules the user taught you after you got something wrong). You output a PATCH, never the whole document — your fields are MERGED into the stored profile in code: fields you OMIT are kept as stored, fields you set REPLACE the stored value, and a field set to null REMOVES it from the profile ("likes": null deletes the whole list). Never repeat unchanged fields, and never null a field you merely do not know — null deletes. The user-side profile is a ROUTING MAP: its values are short topic strings ("cars", "Linux", "TypeScript") that double as probe triggers into your deeper insight memory — keep each value to a phrase, never a sentence; depth does not belong here. The persona and corrections are about YOU, not the user — never confuse the two.
2. INSIGHTS — the DEPTH behind those topics: specific models they like, past statements, working nuances — recalled later by vector probe when that topic comes up. One self-contained sentence each, third person, lead with the topic. When an insight deepens a stored profile value, attach its "path" as "field.keyword" where the keyword names THAT value exactly — short, never a phrase (profile likes "anime" → "likes.anime"); genuinely general insights stay pathless.
3. EPISODE — a single sentence recording what THIS turn was about (the interaction arc: what the user asked, what you did, what was decided or left open). Short-term conversation memory, recalled later by a recency-blended probe when a new turn touches the same topic or the user asks about recent activity. One sentence, past tense, lead with the action ("Helped the user debug the memory app's probe"). Omit when the turn was trivial (greetings, one-word answers, no substance) or when the turn is about memory itself: a recap request ("where did we leave off?", "do you remember what we did?", "what have we been working on?") and its answer only REPEAT earlier turns — they add no activity of their own, and echoing them as an episode would crowd out the real recent activity the next time the user asks. Exception: when the user CORRECTS your recap ("no, we were listening to music"), record the correction's substance — what the recent activity actually was — never the mistaken recap.

You receive:
- USER REQUEST: what the user asked this turn.
- ASSISTANT RESPONSE: what you answered (prose only).
- CURRENT PROFILE: your document so far (may be empty).
- DERIVED INSIGHTS: your deeper memory of this user, already stored (may be absent).
- PRIOR FACTS: this user's OWN stored statements from past conversations, probed by this turn's topic (may be absent).

Rules:
- Evidence only: record ONLY what this payload supports — USER REQUEST, ASSISTANT RESPONSE, CURRENT PROFILE, DERIVED INSIGHTS. Never guess or invent attributes (name, language, timezone, expertise, likes, interests, goals …) the turn did not state or clearly imply; a value you do not know is an OMISSION, never a null and never a guess.
- Derive, don't transcribe: durable characteristics, goals, preferences, expertise, communication style. Never one-off moods, task content, or facts already covered by memory records.
- Persona is about YOU: when the user names you, assigns you a role, or describes how you should behave or speak, record it under "persona" (name, role, personality, greeting, voice). Evidence only — never invent a name or role the user did not give, and never copy the user's own attributes into persona. Persona values are short strings too (name "Sam", role "coding assistant"), never sentences.
- Corrections are lessons: when the user corrects you ("don't do X", "always do Y", "that's wrong — do Z instead"), record it under "corrections" as a short imperative directive keyed by a lowercase dash-joined slug ("lint-before-commit": "always run lint before committing"). The key is a stable handle for later update/remove — the value is what matters. Evidence only — never invent a correction the user did not make. To revise a correction, re-emit its key with the new value; to remove one, set its value to null.
- Episode is the turn's arc, not a fact: one sentence on what this turn was about (asked / did / decided / left open). Omit for trivial turns and for turns that only recap past activity; a corrected recap stores the correction's substance, never the recap itself. Never store secrets or sensitive data in the episode.
- Third person ("The user …"), compact values, no markdown.
- Never store secrets, credentials, or sensitive data the user did not explicitly ask to be remembered.
- DERIVED INSIGHTS are your already-stored depth. When one holds a durable trait that belongs in the routing map (a language, a standing interest, a skill, a preference), promote it into the profile as a SHORT topic string — never copy insight sentences into the profile; depth stays in the insights.
- Connect, never collapse: PRIOR FACTS may echo or complete what this turn reveals. When a new detail plausibly connects to a prior fact (the user disliked the dog food they bought AND you know they own a dog), you MAY record the CONNECTION as a derived insight — hedged, third person, plainly tentative ("… — possibly because the dog refuses it"). Never merge two facts into one claim the user never made, never store the connection as a stated fact, and never let a connection invent or replace a profile value.
- The MERGED profile (the stored document with your patch applied) must stay under the stated character cap — when headroom shrinks, reclaim space by removing the least-durable fields (set them to null) instead of piling on.
- Null means the user explicitly no longer holds that trait ("likes": null after they said they stopped liking X) — never null a field you merely do not know, and never answer with an all-nulls profile: deleting EVERYTHING you know is always a mistake on a normal turn.
- If the turn revealed nothing durable, answer with profile null and an empty insights array.

Respond with EXACTLY one JSON object, nothing else:`,
  after: `- profile: ONLY the fields you are adding, refining, or removing (removal = a null value), or null when nothing durable changed.
- Arrays (expertise, goals, likes, dislikes, interests): when you change one, re-emit its COMPLETE new contents — a partial array REPLACES the stored list and drops whatever you omitted.
- persona (and its nested voice) and corrections are deep-merged like communication/preferences: emit only the sub-fields/keys you are changing; omitted ones survive. To remove a correction, set its key to null.
- insights: only NEW durable depth (omit when none); "path" is optional and only when the insight deepens a profile value.
- episode: one sentence on what this turn was about (omit when trivial or when the turn only recaps past activity).`,
});

/**
 * Assembles the turn payload the cognition job reasons over. Full fidelity by
 * default — `maxPayloadChars` is an optional numCtx-derived valve (marked when
 * it fires), never a silent cut.
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
  /** Optional payload valve (numCtx-derived); undefined/<=0 = uncapped. */
  maxPayloadChars?: number;
}): string {
  const parts = [
    `USER REQUEST: ${limitText(params.userRequest, params.maxPayloadChars)}`,
    `ASSISTANT RESPONSE: ${limitText(params.assistantResponse?.trim() || '(no response text)', params.maxPayloadChars)}`,
    `CURRENT PROFILE: ${params.currentProfile?.trim() || '(nothing learned yet)'}`,
  ];
  const insights = params.insights
    ?.map((insight) => (insight.path ? `[${insight.path}] ${insight.text}` : insight.text))
    .join('\n');
  if (insights) {
    parts.push(
      `DERIVED INSIGHTS (your deeper memory — promote durable topics from here into the profile):\n${limitText(insights, params.maxPayloadChars)}`,
    );
  }
  const priorFacts = params.priorFacts?.map((fact) => `- ${fact.text}`).join('\n');
  if (priorFacts) {
    parts.push(
      `PRIOR FACTS (this user's own past statements, probed by this turn — connect, never collapse):\n${limitText(priorFacts, params.maxPayloadChars)}`,
    );
  }
  parts.push(
    `CHARACTER CAP: the merged profile (the stored document plus your patch) must stay under ${params.limit} characters — prune with nulls before you run out of room.`,
    MEMORY_PROFILE_VERDICT,
  );
  return parts.join('\n\n');
}

const MEMORY_PROFILE_VERDICT =
  'Decide: output the JSON object now — the profile patch (or null when unchanged), any new insights, and an optional episode.';
