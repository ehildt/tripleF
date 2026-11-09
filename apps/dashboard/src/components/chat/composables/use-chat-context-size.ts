import { computed, type ComputedRef } from 'vue';

import { useConversationConfiguration } from '@/components/chat/composables/use-conversation-configuration';
import { TOAST_KEY_CONTEXT_CLAMPED } from '@/composables/toast-keys.constant';
import { useToast } from '@/composables/use-toast/use-toast';
import { i18n } from '@/i18n/i18n';
import { useModelsStore } from '@/stores/models/models.store';
import { formatContextSize } from '@/utils/format-context-size/format-context-size.helper';

import { useChatConversation } from './use-chat-conversation';

interface ChatContextSizeSurface {
  filteredContextSizeOptions: ComputedRef<string[]>;
  defaultContextSize: ComputedRef<string>;
  selectContextSize: (contextSize: string) => void;
}

/**
 * The chat context-size selector: the model-clamped option list, the default
 * size, and the clamp side effect on selection. Composes its dependencies —
 * the models and conversation stores, the active conversation, and the toast
 * service — by import.
 */
export function useChatContextSize(): ChatContextSizeSurface {
  const modelsStore = useModelsStore();
  const configuration = useConversationConfiguration();
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

  function selectContextSize(ctx: string): void {
    const maxCtx = selectedModelObj.value?.context_length;
    if (maxCtx && Number(ctx) > maxCtx) {
      ctx = String(maxCtx);
      toast.warning(
        i18n.global.t('toast.contextClamped', {
          model: selectedModelObj.value?.model ?? '',
          max: formatContextSize(maxCtx),
          value: formatContextSize(maxCtx),
        }),
        { key: TOAST_KEY_CONTEXT_CLAMPED },
      );
    }
    void configuration.setNumCtx(conversationId.value, ctx);
  }

  return {
    filteredContextSizeOptions,
    defaultContextSize,
    selectContextSize,
  };
}
