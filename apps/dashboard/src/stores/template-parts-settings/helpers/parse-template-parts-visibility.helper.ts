import { TEMPLATE_NAMES } from '../template-parts-settings.constant';
import type { TemplatePartsVisibility } from '../template-parts-settings.types';
import { buildDefaultTemplateParts } from './build-default-template-parts.helper';

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** Merge valid persisted overrides into fresh canonical defaults; only false hides a known part. */
export function parseTemplatePartsVisibility(
  saved: string | null,
): TemplatePartsVisibility {
  const defaults = buildDefaultTemplateParts();
  if (saved === null) return defaults;
  try {
    const savedVisibility = asRecord(JSON.parse(saved) as unknown);
    if (!savedVisibility) return defaults;
    for (const template of TEMPLATE_NAMES) {
      const savedParts = asRecord(savedVisibility[template]);
      if (!savedParts) continue;
      for (const partId of Object.keys(defaults[template]))
        if (savedParts[partId] === false) defaults[template][partId] = false;
    }
    return defaults;
  } catch {
    return defaults;
  }
}
