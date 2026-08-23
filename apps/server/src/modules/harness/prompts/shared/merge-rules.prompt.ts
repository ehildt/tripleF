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
