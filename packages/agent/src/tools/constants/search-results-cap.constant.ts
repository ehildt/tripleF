/**
 * Per-call result cap for ranked web-content search endpoints (web, news,
 * places, shopping). Two reasons: ranking quality decays sharply past the
 * top 3, and Google-backed SERP providers resolve only the top 3 result
 * links to real URLs — deeper links can come back as unresolved
 * google.com/goto wrappers that fetch a Google verification page instead of
 * the site. Config schemas and override DTOs admit 1..3; the tools clamp
 * here as the single source of truth. Media endpoints (images, videos) pool
 * assets instead of fetching pages, so they are not governed by this cap.
 */
export const SEARCH_API_RESULTS_CAP = 3;
