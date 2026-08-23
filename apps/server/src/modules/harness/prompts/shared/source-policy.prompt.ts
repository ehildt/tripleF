import type { SourcesConfig } from '../../../provider-overrides/configs/sources-config.adapter.js';

/**
 * SOURCE POLICY section for the response-step system prompt. Preferred
 * domains are soft guidance for grounding and citations; blocked domains are
 * absolute — the sanitize step already dropped their content, and the model
 * must never reintroduce them from its own knowledge. Empty lists (or no
 * config) produce no section at all.
 */
export function buildSourcePolicyPrompt(sources?: SourcesConfig): string {
  const preferred = (sources?.preferred ?? []).filter(Boolean);
  const blocked = (sources?.blocked ?? []).filter(Boolean);
  if (preferred.length === 0 && blocked.length === 0) return '';

  const patternNote = hasPatternEntries(preferred, blocked)
    ? ' Entries starting with *. or wrapped in /slashes/ are hostname patterns.'
    : '';
  const preferredLine =
    preferred.length > 0
      ? `\n- Preferred sources: ${preferred.join(', ')}. Base facts, citations, and sources entries preferentially on content from these domains when it is available.${patternNote}`
      : '';
  const blockedLine =
    blocked.length > 0
      ? `\n- Blocked sources: ${blocked.join(', ')}. Never use, quote, or link content hosted on these domains — not for articles, media, or sources entries.${patternNote}`
      : '';
  return `SOURCE POLICY (ABSOLUTE)${preferredLine}${blockedLine}`;
}

/** True when any entry uses the *.glob or /slashes/ pattern form. */
function hasPatternEntries(...lists: string[][]): boolean {
  return lists.some((list) =>
    list.some(
      (entry) =>
        entry.startsWith('*.') ||
        (entry.length > 2 && entry.startsWith('/') && entry.endsWith('/')),
    ),
  );
}
