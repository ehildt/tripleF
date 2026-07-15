import { computed, type ComputedRef, type Ref, watch } from 'vue';

import { calcTotalContextPercentage } from '../components/chat/shared/helpers/calc-token-percent.helper';
import { useBlink } from './use-blink';

interface SessionSnapshot {
  exchanges: {
    role: string;
    status: string;
    promptEvalCount?: number;
    evalCount?: number;
  }[];
  numCtx: string;
}

import type { OllamaModel } from '../stores/models';
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
        `Selected model supports max ${modelsStore.formatCtx(maxCtx)} context. Clamped to ${modelsStore.formatCtx(maxCtx)}.`,
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
