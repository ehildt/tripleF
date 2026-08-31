/**
 * The contextSummary contract: it replaces the conversation history for the
 * downstream steps, so it must be self-sufficient, query-focused, and
 * verbatim about the entities later steps must cite in standalone queries.
 */
export const CONTEXT_SUMMARY_RULES = `CONTEXT SUMMARY RULES
- The contextSummary replaces the conversation history for later pipeline steps. It must be self-sufficient.
- Extract ONLY what the latest user request references or depends on. Omit everything else.
- Always include: the established topic/entities verbatim (later steps must be able to cite them word-for-word in standalone search queries), key facts from prior answers the follow-up builds on, and user-stated constraints or preferences.
- Resolve short follow-ups ("the second one", "make it shorter", "more", "what about X"): spell out what they refer to from prior turns.
- For imagelist/videolist follow-ups ("more images", "more videos"): include the previously shown image/video URLs verbatim so later steps can skip them.
- For requests about specific prior content ("use the first image as hero", "expand point 2"): include the referenced items verbatim.
- Write it in the language identified by the "language" field.`;

/**
 * The continuation/new-topic switch: a new topic must start with a clean
 * slate — nothing leaks from earlier turns into the contextSummary.
 */
export const TOPIC_SWITCH_RULES = `TOPIC SWITCH RULES
- Before extracting context, classify the relationship between the latest message and the prior turns:
  → CONTINUATION: the latest message follows up, refines, or references the established topic (including short follow-ups like "more", "the second one", "what about X").
  → NEW TOPIC: the latest message introduces a subject that does not depend on prior turns.
- NEW TOPIC → contextSummary MUST be empty. Do not carry over any URLs, sources, entities, facts, or media references from prior turns. Treat the request as if the conversation started now.
- CONTINUATION → extract only what the latest message references, per the CONTEXT SUMMARY RULES.
- Example: turn 1 about dinosaurs, turn 2 about anime characters → NEW TOPIC, contextSummary="".
- Example: turn 1 about the Gothic remake, turn 2 "show me images" → CONTINUATION, contextSummary names the Gothic remake.`;
