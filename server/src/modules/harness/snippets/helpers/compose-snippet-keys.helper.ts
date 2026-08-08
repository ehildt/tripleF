import type { SnippetTemplatePreset } from '../snippet.types.js';

/**
 * The output-contract key lists for a preset: the required spine (layout
 * first) plus every optional field the preset's snippets contribute — these
 * double as the validator's whitelist of surviving keys.
 */
export function composeSnippetKeys(preset: SnippetTemplatePreset): {
  requiredKeys: string[];
  optionalKeys: string[];
} {
  const requiredKeys = ['layout', ...preset.spineKeys];
  const required = new Set(requiredKeys);
  const optionalKeys = preset.snippets
    .flatMap((snippet) => Object.keys(snippet.fields))
    .filter((key) => !required.has(key));
  return { requiredKeys, optionalKeys };
}
