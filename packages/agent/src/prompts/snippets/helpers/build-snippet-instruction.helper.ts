import { buildLayoutInstruction } from '../layout.snippet.js';
import type { ResponseLayout } from '../response-layout.constant.js';
import type { SnippetTemplatePreset } from '../snippet.types.js';

/**
 * Assemble a preset's respond-step instructions from its snippets. The
 * layout block leads and lists only the request's enabled layouts
 * (preset-supported ∩ user-allowed, resolved by the caller); the model
 * fills every snippet it can substantiate and omits the rest.
 */
export function buildSnippetInstruction(preset: SnippetTemplatePreset, allowedLayouts: ResponseLayout[]): string {
  const parts = [buildLayoutInstruction(allowedLayouts), ...preset.snippets.map((snippet) => snippet.instruction)];

  return `MODE: ${preset.template.toUpperCase()}

Compose the response from the snippets below. Include every snippet you can substantiate from the retrieved data; omit any snippet you cannot fill honestly — drop its keys entirely instead of emitting empty placeholders. Emit the keys in the order the snippets are listed.

${parts.join('\n\n')}`;
}
