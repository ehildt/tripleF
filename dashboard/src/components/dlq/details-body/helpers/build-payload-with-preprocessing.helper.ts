import type { DlqEntry } from '@/types/dlq-entry.model';

import type { PreprocessingSettings } from '../../../../stores/preprocessing';

export function buildPayloadWithPreprocessing(
  entry: DlqEntry | null,
  settings: PreprocessingSettings,
): Record<string, unknown> {
  const payload = JSON.parse(JSON.stringify(entry?.payload ?? {}));
  if (!payload.filters) payload.filters = {};
  (payload.filters as Record<string, unknown>).preprocessing = {
    enabled: settings.enabled,
    resize: { ...settings.resize },
    variants: { ...settings.variants },
    parameters: { ...settings.parameters },
  };
  return payload;
}
