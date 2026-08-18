import { computed, onMounted, type Ref, ref } from 'vue';

import { i18n } from '@/i18n/i18n';

import { hasEndpointResults } from '../../sysctl-config.model';
import type { ProviderSectionProps } from '../ProviderSection.types';

const EXCLUDED_KEYS = ['apiKey', 'enabled', 'projectId'];

const ENDPOINT_LABELS: Record<string, string> = {
  web: i18n.global.t('common.endpointWeb'),
  images: i18n.global.t('common.endpointImages'),
  news: i18n.global.t('common.endpointNews'),
  places: i18n.global.t('common.endpointPlaces'),
  shopping: i18n.global.t('common.endpointShopping'),
  videos: i18n.global.t('common.endpointVideos'),
  scrape: i18n.global.t('common.endpointScrape'),
  reviews: i18n.global.t('common.endpointReviews'),
  search: i18n.global.t('common.endpointSearch'),
  quote: i18n.global.t('common.endpointQuote'),
  history: i18n.global.t('common.endpointHistory'),
  technical: i18n.global.t('common.endpointTechnical'),
  fundamentals: i18n.global.t('common.endpointFundamentals'),
};

/**
 * Derives the provider section's display values from its config: the
 * endpoint entries (sorted, with excluded keys dropped), the per-endpoint
 * availability, and the field-grid items-per-row counts.
 */
export function useProviderSection(
  props: ProviderSectionProps,
  prependRef: Ref<HTMLElement | undefined>,
) {
  const isContentDisabled = computed(() => !props.config.enabled);

  function isEndpointUnavailable(name: string): boolean {
    return props.endpointAvailability?.[name] === false;
  }

  const endpointEntries = computed(() => {
    return Object.entries(props.config)
      .filter(([name, value]) => {
        if (EXCLUDED_KEYS.includes(name)) return false;
        return (
          typeof value === 'object' && value !== null && 'enabled' in value
        );
      })
      .sort(([, a], [, b]) => {
        // Fields without a results number come before those with one.
        return Number(hasEndpointResults(a)) - Number(hasEndpointResults(b));
      });
  });

  function getResults(value: unknown): number | undefined {
    return hasEndpointResults(value) ? value.results : undefined;
  }

  /** The prepend slot's FieldCards, counted after mount (static per provider). */
  const prependCount = ref(0);

  onMounted(() => {
    prependCount.value =
      prependRef.value?.querySelectorAll('.field-card').length ?? 0;
  });

  /** Evenly distribute fields: half per row, capped at 5 per row. */
  function itemsPerRowFor(count: number): number {
    return Math.min(5, Math.max(1, Math.ceil(count / 2)));
  }

  const itemsPerRow = computed(() =>
    itemsPerRowFor(endpointEntries.value.length),
  );

  const prependItemsPerRow = computed(
    () => props.prependItemsPerRow ?? itemsPerRowFor(prependCount.value),
  );

  return {
    isContentDisabled,
    isEndpointUnavailable,
    endpointEntries,
    getResults,
    itemsPerRow,
    prependItemsPerRow,
    ENDPOINT_LABELS,
  };
}
