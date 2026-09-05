import Joi from 'joi';

const hostnameSchema = Joi.string().hostname();

/**
 * A source entry is a plain hostname, a `*.glob` pattern, or a `/regex/`
 * pattern. This is the single predicate shared by the env config schema
 * (`sources-config.adapter.ts`) and the overrides write DTO, so the rule is
 * defined once. Entries are expected pre-normalized (the dashboard parser
 * normalizes before sending); this only answers "is it a valid entry?".
 */
export function isSourceEntry(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const entry = value.trim();
  if (!entry) return false;
  if (entry.startsWith('/') && entry.endsWith('/') && entry.length > 2) {
    try {
      new RegExp(entry.slice(1, -1));
      return true;
    } catch {
      return false;
    }
  }
  const isGlob = entry.startsWith('*.');
  const hostname = (isGlob ? entry.slice(2) : entry)
    .toLowerCase()
    .replace(/^www\./, '');
  return !hostnameSchema.validate(hostname).error;
}
