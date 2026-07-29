/**
 * Shared CONTEXT SUMMARY section for downstream steps (execute/respond).
 * Frames the summary as earlier-turn reference data and forbids mixing it
 * into an unrelated current subject.
 */
export function buildContextSummarySection(contextSummary: string): string {
  return [
    'CONTEXT SUMMARY (earlier conversation turns — may be unrelated to the current request)',
    contextSummary,
    'Use this summary ONLY when the latest message explicitly refers to earlier content (e.g. "more", "the second one", "that topic"). If the latest message starts a new topic, ignore it completely. Never mix its URLs, sources, media, or facts into an unrelated subject. When the latest message does refer to earlier content, fold the established subject and entities from this summary into every search query built for it, so each query names its subject explicitly.',
  ].join('\n');
}
