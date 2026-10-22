import { computed } from 'vue';

import { i18n } from '@/i18n/i18n';

import { useApiKeyForm } from '../../../composables/use-api-key-form';
import { buildEodhdCapabilityRows } from '../../helpers/build-eodhd-capability-rows.helper';
import {
  buildEodhdSourceStatus,
  EODHD_ENDPOINT_ICONS,
} from '../../helpers/build-eodhd-source-status.helper';
import type { EodhdSectionProps } from '../EodhdSection.types';

/**
 * Derives the EODHD section's display values from its config: the API-key
 * form state, the capability rows, the source status, and the per-endpoint
 * descriptions.
 */
export function useEodhdSection(props: EodhdSectionProps) {
  const configured = computed(() => !!props.config.apiKey);
  const maskedApiKey = computed(() => props.config.apiKey ?? '');
  const { draft, selectAllText, submit } = useApiKeyForm(
    props.updateApiKey,
    maskedApiKey,
  );

  const capabilities = computed(() => props.config.capabilities);
  const capabilityRows = computed(() =>
    buildEodhdCapabilityRows(capabilities.value),
  );
  const sourceStatus = computed(() =>
    buildEodhdSourceStatus(capabilities.value),
  );
  /** Lock endpoint toggles that the key's plan does not include. */
  const endpointAvailability = computed(() => capabilities.value?.endpoints);

  const descriptions = computed<Record<string, string>>(() => ({
    search: i18n.global.t('common.eodhdSearchDesc'),
    quote: i18n.global.t('common.eodhdQuoteDesc'),
    history: i18n.global.t('common.eodhdHistoryDesc'),
    technical: i18n.global.t('common.eodhdTechnicalDesc'),
    intraday: i18n.global.t('common.eodhdIntradayDesc'),
    news: i18n.global.t('common.eodhdNewsDesc'),
    fundamentals: i18n.global.t('common.eodhdFundamentalsDesc'),
  }));

  const icons = EODHD_ENDPOINT_ICONS;

  return {
    configured,
    maskedApiKey,
    draft,
    selectAllText,
    submit,
    capabilities,
    capabilityRows,
    sourceStatus,
    endpointAvailability,
    descriptions,
    icons,
  };
}
