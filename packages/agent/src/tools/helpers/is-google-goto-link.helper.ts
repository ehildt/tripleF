/**
 * True when the URL is a google.com/goto redirect wrapper — an opaque
 * Google redirect that stands in for the real result URL
 * (https://www.google.com/goto?url=CAES…). The destination cannot be
 * decoded from the token, and opening the wrapper too soon after the search
 * serves a Google verification page instead of the site, so these links
 * must never reach citations or page fetching.
 */
export function isGoogleGotoLink(url: string): boolean {
  try {
    const parsed = new URL(url);
    return /(^|\.)google\.[a-z.]+$/.test(parsed.hostname.toLowerCase()) && parsed.pathname === '/goto';
  } catch {
    return false;
  }
}
