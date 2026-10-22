/**
 * Per-endpoint result caps for the settings UI. Ranked content/entity
 * endpoints (web, news, places, shopping, reviews) are capped at the top 3:
 * ranking quality decays sharply past the top 3, and Google-backed SERP
 * providers resolve only the top 3 result links to real URLs — deeper
 * links can arrive as unresolved google.com/goto wrappers. Media endpoints
 * (images, videos) pool assets rather than fetch pages, so they keep the
 * wider 200 cap. Server-side schemas enforce the same bounds; these mirror
 * them for input clamping and the number field's max.
 */
export const SERPER_ENDPOINT_MAX_RESULTS: Record<string, number> = {
  web: 3,
  images: 200,
  news: 3,
  places: 3,
  shopping: 3,
  reviews: 3,
  videos: 200,
};

export const BRIGHT_DATA_ENDPOINT_MAX_RESULTS: Record<string, number> = {
  web: 3,
  images: 200,
  news: 3,
  places: 3,
  shopping: 3,
  videos: 200,
};
