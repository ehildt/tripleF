import { useClipboard, useTimeoutFn } from '@vueuse/core';
import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

import { getApiUrl } from '@/api/api-url';

import { createId } from '../utils/id.helper';

export type ActiveTab = 'http' | 'preprocessing' | 'dlq' | 'debug' | 'sysctl';

const STAR_KEY = 'harness-chat-star';

function loadStar(): boolean {
  try {
    return localStorage.getItem(STAR_KEY) === 'true';
  } catch {
    return false;
  }
}

function saveStar(value: boolean) {
  try {
    localStorage.setItem(STAR_KEY, String(value));
  } catch {
    /* ignore */
  }
}

export const useAppStore = defineStore('app', () => {
  const activeTab = ref<ActiveTab>('http');
  const abortingId = ref<string | null>(null);
  const { copy } = useClipboard({ legacy: true });
  const copiedIndex = ref<number | null>(null);
  const { start: startCopiedIndexReset } = useTimeoutFn(
    () => {
      copiedIndex.value = null;
    },
    1500,
    { immediate: false },
  );
  const blinkLogo = ref(true);
  const showChatStar = ref(loadStar());

  const VIS_KEY = 'harness-tab-visibility';
  function loadTabVisibility(): Record<string, boolean> {
    try {
      return JSON.parse(localStorage.getItem(VIS_KEY) || '{}');
    } catch {
      return {};
    }
  }
  function saveTabVisibility(v: Record<string, boolean>) {
    try {
      localStorage.setItem(VIS_KEY, JSON.stringify(v));
    } catch {
      /* ignore */
    }
  }
  const tabVisibility = ref<Record<string, boolean>>(loadTabVisibility());

  watch(tabVisibility, saveTabVisibility, { deep: true });

  function isTabVisible(tab: string): boolean {
    return tabVisibility.value[tab] !== false;
  }

  function toggleTabVisibility(tab: string) {
    tabVisibility.value[tab] =
      tabVisibility.value[tab] === false ? true : false;
  }

  const CNT_KEY = 'harness-show-counters';
  function loadShowCounters(): boolean {
    try {
      return localStorage.getItem(CNT_KEY) === 'true';
    } catch {
      return true;
    }
  }
  function saveShowCounters(v: boolean) {
    try {
      localStorage.setItem(CNT_KEY, String(v));
    } catch {
      /* ignore */
    }
  }
  const showCounters = ref(loadShowCounters());

  watch(showCounters, saveShowCounters);

  function toggleShowCounters() {
    showCounters.value = !showCounters.value;
  }

  watch(showChatStar, saveStar);

  watch(activeTab, (tab) => {
    if (tab === 'http') {
      showChatStar.value = false;
    }
  });

  function notifyChatResponse() {
    if (activeTab.value !== 'http') {
      showChatStar.value = true;
    }
  }

  async function handleCopyToClipboard(text: string, index: number) {
    await copy(text);
    copiedIndex.value = index;
    startCopiedIndexReset();
  }

  const requestId = ref(createId());

  function refreshRequestId() {
    requestId.value = createId();
  }

  async function abortJob(requestId: string): Promise<boolean> {
    abortingId.value = requestId;

    try {
      const res = await fetch(getApiUrl('/api/v1/harness/cancel'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.warn('Abort failed:', text);
        abortingId.value = null;
        return false;
      }

      const data = await res.json();
      abortingId.value = null;
      return data.success ?? false;
    } catch (err) {
      console.error('Failed to abort job:', err);
      abortingId.value = null;
      return false;
    }
  }

  return {
    activeTab,
    abortingId,
    copiedIndex,
    blinkLogo,
    showChatStar,
    requestId,
    tabVisibility,
    showCounters,
    refreshRequestId,
    notifyChatResponse,
    handleCopyToClipboard,
    abortJob,
    isTabVisible,
    toggleTabVisibility,
    toggleShowCounters,
  };
});
