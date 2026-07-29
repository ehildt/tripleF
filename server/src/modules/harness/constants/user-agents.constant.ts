/**
 * User agents used when the harness fetches or probes remote media.
 *
 * Hotlink-protecting CDNs (some image/file CDNs behind Cloudflare & co.)
 * answer 403 to non-browser user agents. Probes and downloads first send the
 * harness agent and retry once with the browser agent, avoiding false
 * "broken" verdicts and failed downloads for media that real browsers can load.
 */
export const HARNESS_USER_AGENT = 'triplef-harness/1.0';

export const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
