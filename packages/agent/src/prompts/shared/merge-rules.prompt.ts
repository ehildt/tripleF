/**
 * Merge-template overrides for the content system prompt. The generic
 * STAY-ON-TOPIC and HISTORY-URLS rules would sabotage a merge request: the
 * response MUST consolidate every combined topic, and the media/sources
 * embedded in the merged message ARE the vetted material to consolidate.
 */
export const MERGE_TOPIC_RULE = `MERGE TOPIC
- This is a merge request: the latest user message embeds the previous requests and answers to consolidate ([MERGE REQUEST] sections and the ADDITIONAL INSTRUCTION). The response MUST cover ALL of those combined topics — same-topic material merges into one consolidated part, unrelated pieces are explicitly marked as unrelated and still rendered.
- Never add topics beyond the combined ones, and never pull material from any other conversation turn.`;

export const MERGE_MEDIA_RULES = `MERGE MEDIA
- The media and sources embedded in the merged message (the previous answers being consolidated) ARE the material — treat them as vetted and available, just like current tool results.
- The "videoSearch results only" rule and the "history URLs are never media" rule are WAIVED for merge requests: consolidate the embedded video lists, image galleries, and source lists into the merged video-gallery, gallery, and sources snippets.
- Still deduplicate (by canonical provider ID or title for videos, by URL for images), keep every unique URL, and never reuse a URL in two fields.
- NOTHING IS DROPPED: count the unique media URLs in the embedded material — the merged video gallery and image gallery must contain every one of them as its own entry (plus fresh media from current tool results). Material media belongs in the galleries; listing it only in the sources is a contract violation.
- URLs that do not appear in the embedded material or in current tool results are never invented.`;

/**
 * Model-facing consolidation directive for a merge submit (never localized:
 * the model reads it, not the user). It anchors the merge template's
 * contract: take the snippets from the selected answers and build NEW
 * enriched snippets — one consolidated video/image gallery and sources list,
 * every comparison rendered as its own mergedEvaluations block, the merged
 * narrative in a single bodySections array (one structured block per topic,
 * each with its own hero media) — with the special user request rendered as
 * its own block at the end. The embedded assistant answers carry their full
 * structured JSON, so every snippet field can be merged with complete
 * fidelity.
 */
export function buildMergeDirective(fromRequestIds: string[]): string {
  return `MERGE REQUEST

The user combined the following previous requests into a single request: ${fromRequestIds.join(', ')}.
Produce ONE response using the merge template: take the snippets from the combined answers and build NEW enriched snippets from them.

- Merge all video lists from the combined answers into ONE consolidated video gallery; merge all image galleries into ONE consolidated image gallery; merge all source lists into ONE consolidated sources list; merge all key findings into one key findings list.
- Render EVERY comparison or critique from the combined answers as its own block in mergedEvaluations (one per match-up): its own subjects, its own comparison matrix (never mix subjects of unrelated pairings into one comparison), its own reasoning, and its own recommendations.
- Merge the narrative of the selected answers into ONE bodySections array — one block per topic: topic (concise heading), the topic's own hero media (heroImageUrl/heroImageAlt/heroCaption or heroVideoUrl/heroVideoTitle/heroVideoCaption — heroVideoTitle REQUIRED with a heroVideoUrl; a merge has no single hero, never emit response-level hero fields), strengths (the topic's pros), weaknesses (its cons), recommendations, and content (plain text only when the material is not list-shaped). Same-topic material merges into one block, deduplicating repeat points; unrelated pieces stay in separate blocks with an explicit note and are still rendered. Keep ALL their texts and URLs. A topic's hero media must not be repeated in the galleries or sources.
- EVERY selected prompt counts the same: consolidate each selected answer with equal depth and completeness — never lead with the first selection and compress the rest.
- Answer the special user request from the ADDITIONAL INSTRUCTION at the end of the merged message with its own snippet(s) at the END of all merged snippets.
- This is a merge, NOT a recap or summary of the material — reproduce the consolidated content itself.`;
}
