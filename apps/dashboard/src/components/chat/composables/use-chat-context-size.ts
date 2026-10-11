import { computed } from 'vue';

import { TOAST_KEY_CONTEXT_CLAMPED } from '@/composables/toast-keys';
import { useToast } from '@/composables/use-toast';
import { i18n } from '@/i18n/i18n';
import { useConversationStore } from '@/stores/conversation';
import { useModelsStore } from '@/stores/models';

import { useChatConversation } from './use-chat-conversation';

/**
 * The chat context-size selector: the model-clamped option list, the default
 * size, and the clamp side effect on selection. Composes its dependencies —
 * the models and conversation stores, the active conversation, and the toast
 * service — by import.
 */
export function useChatContextSize() {
  const modelsStore = useModelsStore();
  const conversationStore = useConversationStore();
  const toast = useToast();
  const { conversationId, selectedModelObj } = useChatConversation();

  const allContextSizeOptions = computed(() =>
    modelsStore.numCtxOptions.map(String),
  );

  const filteredContextSizeOptions = computed(() => {
    if (modelsStore.modelsLoading) return [];
    const ctx = selectedModelObj.value?.context_length;
    if (!ctx) return allContextSizeOptions.value;
    return allContextSizeOptions.value.filter((opt) => Number(opt) <= ctx);
  });

  const defaultContextSize = computed(
    () => filteredContextSizeOptions.value.at(-1) ?? '',
  );

  function selectContextSize(ctx: string) {
    const maxCtx = selectedModelObj.value?.context_length;
    if (maxCtx && Number(ctx) > maxCtx) {
      ctx = String(maxCtx);
      toast.warning(
        i18n.global.t('toast.contextClamped', {
          model: selectedModelObj.value?.model ?? '',
          max: modelsStore.formatCtx(maxCtx),
          value: modelsStore.formatCtx(maxCtx),
        }),
        { key: TOAST_KEY_CONTEXT_CLAMPED },
      );
    }
    conversationStore.setNumCtx(conversationId.value, ctx);
  }

  return {
    filteredContextSizeOptions,
    defaultContextSize,
    selectContextSize,
  };
}
