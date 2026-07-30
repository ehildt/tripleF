/**
 * Prefix a structured assistant answer with its `[Template: <name>]` marker
 * so the intent classifier can resolve follow-ups against the template that
 * produced it (e.g. compact shopping lists for repeated product questions).
 * The free-form `text` template is never marked — it is the default routing
 * anyway — and empty answers are returned unchanged.
 *
 * Apply the marker AFTER any markdown conversion (turndown escapes brackets
 * and collapses newlines, which would mangle the marker).
 */
export function withTemplateMarker(text: string, template?: string): string {
  if (!text || !template || template === 'text') return text;
  return `[Template: ${template}]\n${text}`;
}
