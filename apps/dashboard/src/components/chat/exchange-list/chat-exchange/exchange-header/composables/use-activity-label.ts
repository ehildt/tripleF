import { computed, onScopeDispose, type Ref, ref, watch } from 'vue';

import { i18n } from '@/i18n/i18n';
import type { Exchange } from '@/stores/conversation';
import type { HarnessActivityDescriptor } from '@/types/harness-activity.model';

import { buildActivityDescriptors } from '../helpers/build-activity-descriptors.helper';
import { ensureActivityLocaleLoaded } from '../helpers/ensure-activity-locale-loaded.helper';

/** Tool-category keys whose label is composed by appending a query fragment
 *  and/or a source count (with a trailing ellipsis) rather than translated
 *  verbatim. */
const TOOL_CATEGORY_KEYS = new Set([
  'activity.web',
  'activity.images',
  'activity.videos',
  'activity.news',
  'activity.shopping',
  'activity.reviews',
  'activity.places',
  'activity.fetch',
  'activity.reference',
  'activity.variants',
]);

const CYCLE_INTERVAL_MS = 2000;

function translateToolCategory(
  descriptor: HarnessActivityDescriptor,
  locale: string,
): string {
  const meta = descriptor.meta ?? {};
  let label: string;

  if (descriptor.key === 'activity.executingTool') {
    label = i18n.global.t(descriptor.key, { tool: meta.tool }, { locale });
    return `${label}…`;
  }

  label = i18n.global.t(descriptor.key, {}, { locale });
  const query = meta.query as string | undefined;
  const count = meta.count as number | undefined;
  if (query) {
    label += ` ${i18n.global.t('activity.forQuery', { query }, { locale })}`;
  }
  if (count && count > 1) {
    label += ` ${i18n.global.t(
      'activity.sourcesCount',
      { count },
      { locale },
    )}`;
  }
  return `${label}…`;
}

function translateDescriptor(
  descriptor: HarnessActivityDescriptor,
  locale: string,
): string {
  if (
    TOOL_CATEGORY_KEYS.has(descriptor.key) ||
    descriptor.key === 'activity.executingTool'
  ) {
    return translateToolCategory(descriptor, locale);
  }
  return i18n.global.t(descriptor.key, descriptor.meta ?? {}, { locale });
}

/**
 * Derive the activity label shown next to the cancel icon while the assistant
 * exchange is pending ("thinking..", a tool step, or the current pipeline
 * step). Each activity is localized in the language the model chose to respond
 * in; when several tool categories run in parallel the label cycles through
 * them one at a time instead of chaining them with separators.
 */
export function useActivityLabel(exchange: Ref<Exchange>) {
  const activityLabel = ref('');
  let cycleTimer: ReturnType<typeof setInterval> | null = null;
  let latestRun = 0;

  const descriptors = computed(() =>
    buildActivityDescriptors({
      reasoning: exchange.value.reasoning,
      toolCalls: exchange.value.toolCalls,
      activity: exchange.value.activity,
    }),
  );

  const targetLocale = computed(
    () => exchange.value.activityLanguage ?? i18n.global.locale.value,
  );

  function stopCycle(): void {
    if (cycleTimer) {
      clearInterval(cycleTimer);
      cycleTimer = null;
    }
  }

  function startCycle(labels: string[]): void {
    if (labels.length <= 1) return;
    let index = 0;
    activityLabel.value = labels[0];
    cycleTimer = setInterval(() => {
      index = (index + 1) % labels.length;
      activityLabel.value = labels[index];
    }, CYCLE_INTERVAL_MS);
  }

  async function refresh(): Promise<void> {
    const run = ++latestRun;
    const list = descriptors.value;
    if (!list.length) {
      stopCycle();
      activityLabel.value = '';
      return;
    }
    const locale = targetLocale.value;
    await ensureActivityLocaleLoaded(locale);
    if (run !== latestRun) return;

    const labels = list.map((descriptor) =>
      translateDescriptor(descriptor, locale),
    );
    stopCycle();
    if (labels.length === 1) {
      activityLabel.value = labels[0];
      return;
    }
    startCycle(labels);
  }

  watch([descriptors, targetLocale], () => void refresh(), { immediate: true });

  onScopeDispose(stopCycle);

  return { activityLabel };
}
