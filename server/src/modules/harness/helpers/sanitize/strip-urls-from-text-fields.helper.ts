/**
 * Keys (lowercased) whose values are ALLOWED to contain URLs. Every other
 * string field in a structured response is a display text node, and the
 * output contract forbids raw URLs there.
 */
const URL_ALLOWED_KEYS = new Set([
  'url',
  'link',
  'imageurl',
  'videourl',
  'heroimageurl',
  'herovideourl',
  'thumbnailurl',
  'website',
  'sourcepageurl',
  'reviewlink',
]);

const RAW_URL_PATTERN = /(?:https?:\/\/|www\.)[^\s)"'<>]+/gi;

/** Remove raw URLs from a display text and repair the leftover spacing. */
function stripUrlsFromText(text: string): string {
  if (!RAW_URL_PATTERN.test(text)) {
    RAW_URL_PATTERN.lastIndex = 0;
    return text;
  }
  RAW_URL_PATTERN.lastIndex = 0;
  return text
    .replace(RAW_URL_PATTERN, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .trim();
}

/**
 * Recursively strip raw URLs (absolute http(s) or bare `www.` links) from
 * every display text field in a structured response. The model sometimes
 * copies URLs from fetched page content into prose fields (sectionContent,
 * shortDescription, spec rows) instead of the designated URL fields — those
 * leak as raw text into the dashboard. URL-designated fields (url, link,
 * imageUrl, videoUrl, …) are left untouched.
 */
export function stripUrlsFromTextFields(value: unknown): unknown {
  if (typeof value === 'string') return stripUrlsFromText(value);

  if (Array.isArray(value)) {
    return value.map((item) => stripUrlsFromTextFields(item));
  }

  if (value !== null && typeof value === 'object') {
    const stripped: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      stripped[key] = URL_ALLOWED_KEYS.has(key.toLowerCase())
        ? val
        : stripUrlsFromTextFields(val);
    }
    return stripped;
  }

  return value;
}
