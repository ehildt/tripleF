import { getNumberEnv } from '@ehildt/ckir-helpers/get-number-env';
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
  /**
   * How many web image candidates the pipeline pools for the image-analysis
   * templates (describe/compare/ocr): fetched via the enabled image-search
   * providers, verified, and offered to the response model for visual
   * matching. An explicit count in the user's prompt still wins. 0 disables
   * the reference pool entirely (no images verified).
   */
  imageTaskReferenceCount: number;
}

/** Default pool size for image-task reference candidates. */
const DEFAULT_IMAGE_TASK_REFERENCE_COUNT = 6;
/** Upper bound: pool entries are also fed to the response model as pixels. */
const MAX_IMAGE_TASK_REFERENCE_COUNT = 50;

/**
 * Default blocklist: Google's low-resolution thumbnail/user-content proxy
 * hosts, plus analytics/tracker hosts and low-trust platforms. Covers the
 * same scope as the harness BLOCKED_IMAGE_HOSTS list (which
 * provider-overrides must not import — harness depends on this module,
 * never the reverse), collapsed into glob entries.
 */
const DEFAULT_BLOCKED_SOURCES = [
  '*.gstatic.com',
  '*.googleusercontent.com',
  '*.google-analytics.com',
  '*.googletagmanager.com',
  '*.doubleclick.net',
  '*.facebook.net',
  '*.tiktok.com',
];

/**
 * Default preferred sources: the supported video providers plus a few
 * well-known editorial tech/news sites — rank-boosted ahead of the long tail.
 */
const DEFAULT_PREFERRED_SOURCES = [
  'youtube.com',
  'vimeo.com',
  'dailymotion.com',
  'loom.com',
  'wistia.com',
  'heise.com',
  'heise.de',
  'thehackernews.com',
];

/** A /slashed/ entry whose pattern compiles, a *.glob, or a plain hostname. */
// Strict mirror of the dashboard's forgiving textarea normalization
// (dashboard parse-source-list.helper.ts): entries arriving via env or the
// overrides API are expected to be pre-normalized — API callers always go
// through that parser first, and invalid env entries fail validation fast
// instead of being silently fixed. Keep both sides' regex/glob/www
// semantics in sync.
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
  imageTaskReferenceCount: Joi.number()
    .integer()
    .min(0)
    .max(MAX_IMAGE_TASK_REFERENCE_COUNT)
    .required(),
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
  const preferred = [
    ...new Set([
      ...DEFAULT_PREFERRED_SOURCES,
      ...parseHostnameList(env.SOURCES_PREFERRED),
    ]),
  ];
  const blocked = [
    ...new Set([
      ...DEFAULT_BLOCKED_SOURCES,
      ...parseHostnameList(env.SOURCES_BLOCKED),
    ]),
  ];
  return {
    preferred,
    blocked,
    imageTaskReferenceCount: getNumberEnv(
      env.SOURCES_IMAGE_TASK_REFERENCE_COUNT,
      DEFAULT_IMAGE_TASK_REFERENCE_COUNT,
    ) as number,
  };
}
