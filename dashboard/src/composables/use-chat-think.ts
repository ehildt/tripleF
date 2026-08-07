import { computed, type ComputedRef, type Ref, ref, watch } from 'vue';

import { i18n } from '@/i18n/i18n';
import { useConversationStore } from '@/stores/conversation';

import type { OllamaModel } from '../stores/models';
import type { useToast } from './use-toast';

const THINK_KEY = 'harness-selected-think';
const thinkOptions = ['off', 'low', 'medium', 'high'] as const;

export function useChatThink(
  selectedModelObj: ComputedRef<OllamaModel | null>,
  conversationId: Ref<string>,
  conversationStore: ReturnType<typeof useConversationStore>,
  toast: ReturnType<typeof useToast>,
) {
  const selectedThink = ref(localStorage.getItem(THINK_KEY) || 'medium');

  const supportsThink = computed(() => {
    const m = selectedModelObj.value;
    if (!m) return true;
    return m.capabilities?.includes('thinking') ?? false;
  });

  const filteredThinkOptions = computed(() => {
    if (supportsThink.value) return [...thinkOptions];
    return ['off'];
  });

  watch(selectedModelObj, (m, prevM) => {
    if (!m || !prevM) return;
    if (selectedThink.value !== 'off' && !supportsThink.value) {
      selectThink('off');
      toast.warning(i18n.global.t('toast.modelNoThink', { model: m.model }));
    }
  });

  function selectThink(think: string) {
    selectedThink.value = think;
    localStorage.setItem(THINK_KEY, think);
    if (conversationId.value) {
      conversationStore.setThink(conversationId.value, think);
    }
  }

  return {
    selectedThink,
    supportsThink,
    filteredThinkOptions,
    selectThink,
  };
}
