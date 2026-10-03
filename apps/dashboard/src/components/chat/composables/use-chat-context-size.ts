import { computed, watch } from 'vue';

import { TOAST_KEY_CONTEXT_CLAMPED } from '@/composables/toast-keys';
import { useBlink } from '@/composables/use-blink';
import { useToast } from '@/composables/use-toast';
import { i18n } from '@/i18n/i18n';
import { useConversationStore } from '@/stores/conversation';
import { useModelsStore } from '@/stores/models';

import { calcTotalContextPercentage } from '../shared/helpers/calc-total-context-percentage.helper';
import { useChatConversation } from './use-chat-conversation';

/**
 * The chat context-size selector: the model-clamped option list, the default
 * size, the live token-percentage that drives the context blink, and the
 * clamp side effect on selection. Composes its dependencies — the models and
 * conversation stores, the active conversation, and the toast service — by
 * import.
 */
export function useChatContextSize() {
  const modelsStore = useModelsStore();
  const conversationStore = useConversationStore();
  const toast = useToast();
  const { conversation, conversationId, selectedModelObj } =
    useChatConversation();

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

  const contextBlink = useBlink();

  const tokenPercent = computed(() => {
    const s = conversation.value;
    if (!s) return null;
    return calcTotalContextPercentage(s.exchanges, s.numCtx);
  });

  watch([tokenPercent], ([pct]) => {
    if (pct != null && Number(pct) >= 90) {
      contextBlink.start();
    } else {
      contextBlink.stop();
    }
  });

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
    contextBlink,
    tokenPercent,
    selectContextSize,
  };
}
