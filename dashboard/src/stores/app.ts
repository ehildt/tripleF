import { defineStore } from 'pinia';
import { ref } from 'vue';

import { getApiUrl } from '@/api/api-url';

import { useClipboard } from '../composables/use-clipboard';
import { createId } from '../utils/id.helper';
import { delay } from '../utils/promise.helper';

export type ActiveTab = 'rest' | 'mcp' | 'preprocessing' | 'dlq' | 'debug';

export const useAppStore = defineStore('app', () => {
  const activeTab = ref<ActiveTab>('rest');
  const abortingId = ref<string | null>(null);
  const { copy: _copy } = useClipboard(1500);
  const copiedIndex = ref<number | null>(null);
  const blinkLogo = ref(true);

  async function handleCopyToClipboard(text: string, index: number) {
    await _copy(text);
    copiedIndex.value = index;
    await delay(1500);
    copiedIndex.value = null;
  }

  // Request IDs for different panels
  const restRequestId = ref(createId());
  const mcpRequestId = ref(createId());

  function refreshRestRequestId() {
    restRequestId.value = createId();
  }

  function refreshMcpRequestId() {
    mcpRequestId.value = createId();
  }

  function handleModelSelected() {
    blinkLogo.value = true;
    setTimeout(() => {
      blinkLogo.value = false;
    }, 3000);
  }

  async function abortJob(requestId: string): Promise<boolean> {
    abortingId.value = requestId;

    try {
      const res = await fetch(getApiUrl('/api/v1/vision/cancel'), {
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
    restRequestId,
    mcpRequestId,
    refreshRestRequestId,
    refreshMcpRequestId,
    handleModelSelected,
    handleCopyToClipboard,
    abortJob,
  };
});
