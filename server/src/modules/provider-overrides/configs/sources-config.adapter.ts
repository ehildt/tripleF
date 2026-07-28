import Joi from 'joi';

/**
 * Dynamic source config: content domains the pipeline prefers (rank boost +
 * prompt guidance) or blocks (dropped from tool context entirely). Managed
 * at runtime through the provider-overrides API (SysCtl), with env vars as
 * the pristine defaults — same contract as the Serper provider overrides.
 * Entries are hostnames, *.glob patterns, or /regex/ patterns — all match
 * the apex domain and its subdomains (regexes define their own scope).
 */
export interface SourcesConfig {
  preferred: string[];
  blocked: string[];
}

/**
 * Default blocklist: Google's low-resolution thumbnail/user-content proxy
 * hosts. Covers the same scope as the harness BLOCKED_IMAGE_HOSTS list
 * (which provider-overrides must not import — harness depends on this
 * module, never the reverse), collapsed into two glob entries.
 */
const DEFAULT_BLOCKED_SOURCES = ['*.gstatic.com', '*.googleusercontent.com'];

/** A /slashed/ entry whose pattern compiles, a *.glob, or a plain hostname. */
const sourceEntrySchema = Joi.string().custom((value: string, helpers) => {
  const entry = String(value).trim();
  if (!entry) return helpers.error('any.invalid');
  if (entry.startsWith('/') && entry.endsWith('/') && entry.length > 2) {
    try {
      new RegExp(entry.slice(1, -1));
      return entry;
    } catch {
      return helpers.error('any.invalid');
    }
  }
  const isGlob = entry.startsWith('*.');
  const normalized = (isGlob ? entry.slice(2) : entry)
    .toLowerCase()
    .replace(/^www\./, '');
  return Joi.string().hostname().validate(normalized).error
    ? helpers.error('any.invalid')
    : isGlob
      ? `*.${normalized}`
      : normalized;
});

const hostnameListSchema = Joi.array().items(sourceEntrySchema).required();

export const SourcesConfigSchema = Joi.object<SourcesConfig>({
  preferred: hostnameListSchema,
  blocked: hostnameListSchema,
}).required();

/** Parse a comma-separated env list into deduped lowercase hostnames. */
function parseHostnameList(value: string | undefined): string[] {
  if (!value) return [];
  return [
    ...new Set(
      value
        .split(',')
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
}

export function SourcesConfigAdapter(env = process.env): SourcesConfig {
  const preferred = parseHostnameList(env.SOURCES_PREFERRED);
  const blocked = [
    ...new Set([
      ...DEFAULT_BLOCKED_SOURCES,
      ...parseHostnameList(env.SOURCES_BLOCKED),
    ]),
  ];
  return { preferred, blocked };
}
