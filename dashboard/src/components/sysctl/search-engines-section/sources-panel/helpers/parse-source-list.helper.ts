/**
 * Normalize a free-form "one entry per line" textarea value into a deduped
 * source list. Entries are hostnames (lowercased; pasted URLs are stripped
 * to their host), *.glob patterns, or /slash-wrapped/ hostname regexes kept
 * verbatim when they compile. Anything else is dropped.
 */
const HOSTNAME_PATTERN =
  /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

export function parseSourceList(raw: string): string[] {
  const seen = new Set<string>();
  for (const line of raw.split('\n')) {
    const entry = normalizeLine(line);
    if (entry) seen.add(entry);
  }
  return [...seen];
}

function normalizeLine(line: string): string {
  const trimmed = line.trim();
  if (!trimmed) return '';

  // /slashed/ regex entries: keep verbatim when the pattern compiles.
  if (trimmed.startsWith('/') && trimmed.endsWith('/') && trimmed.length > 2) {
    try {
      new RegExp(trimmed.slice(1, -1));
      return trimmed;
    } catch {
      return '';
    }
  }

  const isGlob = trimmed.startsWith('*.');
  let value = (isGlob ? trimmed.slice(2) : trimmed).toLowerCase();
  value = value.replace(/^https?:\/\//, '').replace(/^www\./, '');
  // Drop everything after the first path/query/port separator.
  value = value.split(/[/?:#]/)[0];
  if (!HOSTNAME_PATTERN.test(value)) return '';
  return isGlob ? `*.${value}` : value;
}
