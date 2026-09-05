import { computed, ref, watch } from 'vue';

import { warmModel } from '@/api/warm-model.api';
import {
  TOAST_KEY_CONTEXT_CLAMPED,
  TOAST_KEY_MODEL_NO_IMAGES,
} from '@/composables/toast-keys';
import { i18n } from '@/i18n/i18n';
import { useAppStore } from '@/stores/app';
import { useConversationStore } from '@/stores/conversation';

import { useToast } from '../../../../../composables/use-toast';
import { useModelsStore } from '../../../../../stores/models';

const VISION_CAPABILITY = 'vision';

/**
 * Manages the selected model for the active conversation, including persistence
 * and context-clamping. Owns the model menu open/close state.
 */
export function useSelectedModel() {
  const modelsStore = useModelsStore();
  const conversationStore = useConversationStore();
  const appStore = useAppStore();
  const toast = useToast();

  const conversationId = computed(
    () => conversationStore.activeConversationId ?? '',
  );
  const conversation = computed(
    () => conversationStore.getConversation(conversationId.value) ?? null,
  );

  // ── Selected model (persisted) ───────────────────────────
  const selectedModel = ref(modelsStore.selectedModel);

  // ── Model availability ───────────────────────────────────
  const isModelAvailable = computed(() => {
    const model = conversation.value?.model || selectedModel.value;
    if (!model) return null;
    if (modelsStore.modelsLoading) return null;
    if (!modelsStore.models.length) return null;
    return modelsStore.models.some((m) => m.model === model);
  });

  const selectedModelDetails = computed(() => {
    const name = conversation.value?.model || selectedModel.value;
    if (!name) return null;
    return modelsStore.getModel(name) ?? null;
  });

  const hasNoModelSelected = computed(
    () => !(conversation.value?.model || selectedModel.value),
  );

  watch(
    () => modelsStore.selectedModel,
    (modelName) => {
      selectedModel.value = modelName;
    },
  );

  const supportsVision = computed(() => {
    const caps = selectedModelDetails.value?.capabilities;
    if (!caps) return true;
    return caps.includes(VISION_CAPABILITY);
  });

  function syncImageSelectionsForVisionState(conversationIdValue: string) {
    if (!conversationIdValue) return;
    const s = conversationStore.getConversation(conversationIdValue);
    if (!s) return;

    const previouslyNonVision =
      Object.keys(s.imageSelectionSnapshot).length > 0;

    if (supportsVision.value) {
      if (previouslyNonVision) {
        conversationStore.restoreImageSelections(conversationIdValue);
        s.imageSelectionSnapshot = {};
      }
      return;
    }

    if (previouslyNonVision) {
      conversationStore.deselectAllImages(conversationIdValue);
      return;
    }

    conversationStore.snapshotImageSelections(conversationIdValue);
    conversationStore.deselectAllImages(conversationIdValue);
    // Name the model whose capabilities decided `supportsVision` — not
    // `conversation.model`, which is still '' when the model was picked
    // before a conversation existed (or while a stub is hydrating).
    toast.warning(
      i18n.global.t('toast.modelNoImages', {
        model: selectedModelDetails.value?.model ?? s.model,
      }),
      { key: TOAST_KEY_MODEL_NO_IMAGES },
    );
  }

  function syncNumCtxForModel(
    conversationIdValue: string,
    modelName: string | undefined,
  ) {
    if (!conversationIdValue || !modelName) return;
    const s = conversationStore.getConversation(conversationIdValue);
    if (!s || s.numCtx) return;

    const numCtx = modelsStore.maxNumCtxForModel(modelName);
    if (numCtx) conversationStore.setNumCtx(conversationIdValue, numCtx);
  }

  watch(
    () => [conversationId.value, selectedModelDetails.value?.model],
    ([currentSessionId, modelName]) => {
      syncImageSelectionsForVisionState(currentSessionId as string);
      syncNumCtxForModel(
        currentSessionId as string,
        modelName as string | undefined,
      );
    },
    { immediate: true },
  );

  // ── Change model ────────────────────────────────────────
  function changeModel(modelName: string) {
    selectedModel.value = modelName;
    modelsStore.setSelectedModel(modelName);

    // Opt-in warm-up: pre-load local model weights so the first prompt does
    // not stall on a cold load. Cloud models are served remotely — skip.
    if (appStore.warmModelOnSelect) {
      const origin = modelsStore.getModel(modelName)?.origin;
      if (origin !== 'cloud') void warmModel(modelName);
    }

    if (conversationId.value) {
      conversationStore.setModel(conversationId.value, modelName);
      const m = modelsStore.getModel(modelName);
      if (m?.context_length) {
        const maxOpt = modelsStore.maxNumCtxForModel(modelName);
        const current = Number(
          conversationStore.getConversation(conversationId.value)?.numCtx ?? 0,
        );
        if (current > m.context_length) {
          conversationStore.setNumCtx(conversationId.value, maxOpt);
          toast.warning(
            i18n.global.t('toast.contextClamped', {
              model: modelName,
              max: modelsStore.formatCtx(m.context_length),
              value: modelsStore.formatCtx(Number(maxOpt)),
            }),
            { key: TOAST_KEY_CONTEXT_CLAMPED },
          );
        } else if (maxOpt) {
          conversationStore.setNumCtx(conversationId.value, maxOpt);
        }
      }
      syncImageSelectionsForVisionState(conversationId.value);
    }
  }

  return {
    conversationId,
    conversation,
    selectedModel,
    isModelAvailable,
    selectedModelDetails,
    hasNoModelSelected,
    changeModel,
  };
}
