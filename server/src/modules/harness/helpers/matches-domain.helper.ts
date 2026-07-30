/**
 * Hostname matching for the source policy. A URL (or bare hostname) matches
 * a configured entry when its hostname:
 * - equals the hostname of a plain or *.glob entry, or is a subdomain of it
 *   ("en.example.org" and "example.org" both match "example.org"
 *   and "*.example.org");
 * - satisfies a /slashed/ regex pattern, matched case-insensitively
 *   (e.g. /^lh\d+\.googleusercontent\.com$/).
 * Comparison is lowercase and ignores a leading "www." on both sides.
 */
export function matchesDomain(urlOrHost: string, entry: string): boolean {
  const hostname = hostnameOf(urlOrHost) || normalizeHost(urlOrHost);
  if (!hostname) return false;

  const regex = parseRegexEntry(entry);
  if (regex) return regex.test(hostname);

  const trimmed = entry.trim().toLowerCase();
  const normalized = normalizeHost(
    trimmed.startsWith('*.') ? trimmed.slice(2) : trimmed,
  );
  if (!normalized) return false;
  return hostname === normalized || hostname.endsWith(`.${normalized}`);
}

const regexCache = new Map<string, RegExp>();

/** Compiled regex for a /slashed/ policy entry, or undefined otherwise. */
function parseRegexEntry(entry: string): RegExp | undefined {
  const trimmed = entry.trim();
  if (trimmed.length < 3 || !trimmed.startsWith('/') || !trimmed.endsWith('/'))
    return undefined;
  const source = trimmed.slice(1, -1);
  let regex = regexCache.get(source);
  if (!regex) {
    try {
      regex = new RegExp(source, 'i');
    } catch {
      return undefined;
    }
    regexCache.set(source, regex);
  }
  return regex;
}

/** Bare hostname of a URL, lowercased and without a leading "www.". */
export function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

/** Normalize a bare hostname (no scheme, port, path, or query). */
function normalizeHost(value: string): string {
  const candidate = value
    .trim()
    .toLowerCase()
    .replace(/^www\./, '');
  return /^[a-z0-9.-]+$/.test(candidate) ? candidate : '';
}
