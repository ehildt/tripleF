import { computed, ref, watch } from 'vue';

import { TOAST_KEY_MODEL_NO_THINK } from '@/composables/toast-keys';
import { useToast } from '@/composables/use-toast';
import { i18n } from '@/i18n/i18n';
import { useConversationStore } from '@/stores/conversation';

import { useChatConversation } from './use-chat-conversation';

const THINK_KEY = 'harness-selected-think';
const thinkOptions = ['off', 'low', 'medium', 'high'] as const;

/**
 * The chat think-level selector: which think options the selected model
 * supports, the persisted choice, and the side effects that clamp a
 * non-thinking model to "off". Composes its dependencies — the active
 * conversation, the conversation store, and the toast service — by import.
 */
export function useChatThink() {
  const conversationStore = useConversationStore();
  const toast = useToast();
  const { conversationId, selectedModelObj } = useChatConversation();

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
      toast.warning(i18n.global.t('toast.modelNoThink', { model: m.model }), {
        key: TOAST_KEY_MODEL_NO_THINK,
      });
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
