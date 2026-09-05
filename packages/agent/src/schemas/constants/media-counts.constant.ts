/**
 * System-wide media-retrieval defaults: the pipeline's target count when the
 * user named no number, and the count for an unquantified "more images /
 * more videos" follow-up. Tool prompts, the intent schema field docs, and the
 * server's sanitize media targets all interpolate these constants so prose
 * and behavior can never drift apart.
 */
export const DEFAULT_MEDIA_COUNT = 6;
export const MORE_MEDIA_COUNT = 12;
