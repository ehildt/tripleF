import { computed, type ComputedRef, type Ref, watch } from 'vue';

import { i18n } from '@/i18n/i18n';

import { calcTotalContextPercentage } from '../components/chat/shared/helpers/calc-token-percent.helper';
import type { OllamaModel } from '../types/ollama-model.model';
import { TOAST_KEY_CONTEXT_CLAMPED } from './toast-keys';
import { useBlink } from './use-blink';
import type { SessionSnapshot } from './use-chat-context-size.types';
import type { useToast } from './use-toast';

export function useChatContextSize(
  modelsStore: {
    numCtxOptions: number[];
    formatCtx: (n: number) => string;
    modelsLoading: boolean;
  },
  conversation: ComputedRef<SessionSnapshot | null>,
  conversationId: Ref<string>,
  selectedModelObj: ComputedRef<OllamaModel | null>,
  conversationStore: {
    setNumCtx: (id: string, ctx: string) => void;
  },
  toast: ReturnType<typeof useToast>,
) {
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
