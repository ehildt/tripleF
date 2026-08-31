/**
 * The video providers the pipeline renders as embeds. The server's media-url
 * validator (EMBEDDABLE_HOSTS) is the host-level truth; these labels are the
 * model-facing vocabulary — one constant so tool descriptions and prompt
 * prose can never drift apart.
 */
export const EMBEDDABLE_VIDEO_PROVIDER_LABELS = 'YouTube, Vimeo, Dailymotion, Loom, Wistia';

/** Shared video-tool description clause: which providers are embeddable. */
export const EMBEDDABLE_VIDEO_PROVIDER_CLAUSE = `Only return URLs from supported embeddable providers: ${EMBEDDABLE_VIDEO_PROVIDER_LABELS}, or direct video files. Reject Instagram, Facebook, TikTok, Twitch, X/Twitter, and other unreliable platforms.`;
