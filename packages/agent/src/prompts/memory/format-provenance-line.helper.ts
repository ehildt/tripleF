/**
 * One provenance-labeled record line — the shared rendering for every
 * memory-probe / prior-memory / adjudication payload: who stated the record
 * and when. Callers add their own list prefix.
 */
export function formatProvenanceLine(line: { text: string; role: string; createdAt?: string }): string {
  const who = line.role === 'user' ? 'the user' : 'you (assistant)';
  const when = line.createdAt ? ` on ${new Date(line.createdAt).toISOString().slice(0, 10)}` : '';
  return `"${line.text}" — stated by ${who}${when}`;
}
