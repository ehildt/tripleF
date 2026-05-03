import { useClipboard } from '@vueuse/core';
import { computed, type ComputedRef, ref, watch } from 'vue';

import { formatBody } from '@/utils/format-body.helper';

import type { DebugResult } from '../../../../types/debug.model';
import { calcRequestTokenPercent } from '../helpers/calc-request-token-percent.helper';
import {
  type DetailTab,
  type DetailTabId,
  parseRequestEndpoint,
} from '../helpers/parse-request-endpoint.helper';

/**
 * Reactive state for the request details panel: parsed endpoint, the
 * tab list, the active tab, the active content, and clipboard copy
 * with auto-reset.
 */
export function useRequestDetails(result: ComputedRef<DebugResult | null>) {
  const parsedEndpoint = computed(() => parseRequestEndpoint(result.value));

  const tokenPercent = computed(() => {
    const r = result.value;
    if (!r) return null;
    return calcRequestTokenPercent(r);
  });

  const tabs = computed<DetailTab[]>(() => {
    const r = result.value;
    if (!r) return [];
    const items: DetailTab[] = [];

    if (r.errorMessage) {
      items.push({ id: 'error', label: 'Error', content: r.errorMessage });
    }
    if (r.prompt) {
      items.push({ id: 'prompt', label: 'Prompt', content: r.prompt });
    }
    if (r.type !== 'socket' && parsedEndpoint.value.params.length) {
      items.push({
        id: 'params',
        label: 'Params',
        content: formatBody(
          Object.fromEntries(
            parsedEndpoint.value.params.map((p) => [p.key, p.value]),
          ),
        ),
      });
    }
    if (r.requestHeaders) {
      items.push({
        id: 'headers',
        label: 'Headers',
        content: formatBody(r.requestHeaders as any),
      });
    }
    if (r.requestBody) {
      items.push({
        id: 'body',
        label: 'Body',
        content: formatBody(r.requestBody),
      });
    }
    if (r.responseBody) {
      items.push({
        id: 'response',
        label: 'Response',
        content: formatBody(r.responseBody),
      });
    }
    return items;
  });

  const activeTab = ref<DetailTabId | null>(null);

  // Reset to the first available tab when the result id changes.
  watch(
    () => result.value?.id,
    () => {
      activeTab.value = tabs.value[0]?.id ?? null;
    },
    { flush: 'post' },
  );

  // Keep the active tab valid as the tab list evolves.
  watch(
    tabs,
    (newTabs) => {
      if (!activeTab.value || !newTabs.some((t) => t.id === activeTab.value)) {
        activeTab.value = newTabs[0]?.id ?? null;
      }
    },
    { immediate: true, flush: 'post' },
  );

  const activeContent = computed<DetailTab | null>(() => {
    if (!activeTab.value) return null;
    return tabs.value.find((t) => t.id === activeTab.value) ?? null;
  });

  function selectTab(tabId: DetailTabId) {
    activeTab.value = activeTab.value === tabId ? null : tabId;
  }

  const { copy, copied: isCopied } = useClipboard({ legacy: true });

  function copyActive() {
    if (activeContent.value) {
      copy(activeContent.value.content as string);
    }
  }

  return {
    parsedEndpoint,
    tokenPercent,
    tabs,
    activeTab,
    activeContent,
    selectTab,
    copyActive,
    isCopied,
  };
}
