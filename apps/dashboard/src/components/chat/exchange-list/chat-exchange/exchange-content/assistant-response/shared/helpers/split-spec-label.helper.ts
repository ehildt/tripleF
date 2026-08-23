import type { SpecLabelValue } from './split-spec-label.helper.types';

/**
 * Split a row in strict "Label: value" format into its parts. Rows
 * without a colon return an empty label so the template can render the
 * text full-width.
 */
export function splitSpecLabel(text: string): SpecLabelValue {
  const colonIndex = text.indexOf(':');
  if (colonIndex <= 0) return { label: '', value: text };
  return {
    label: text.slice(0, colonIndex).trim(),
    value: text.slice(colonIndex + 1).trim(),
  };
}
