import { computed } from 'vue';

import { warmModel } from '@/api/warm-model.api';
import { TOAST_KEY_CONTEXT_CLAMPED } from '@/composables/toast-keys';
import { useToast } from '@/composables/use-toast';
import { i18n } from '@/i18n/i18n';
import { useAppStore } from '@/stores/app';
import { useConversationStore } from '@/stores/conversation';
import { useModelsStore } from '@/stores/models';

import { resolveNumCtxForModel } from '../shared/helpers/resolve-num-ctx-for-model.helper';

/**
 * The left toolbar's model-selection surface: the selected model, its
 * capabilities and availability, and the model-change action (warm-up,
 * numCtx clamp, and clamp toast). Everything here derives from the
 * conversation and models stores, so there is no state to hoist.
 */
export function useSelectedModel() {
  const conversationStore = useConversationStore();
  const modelsStore = useModelsStore();
  const appStore = useAppStore();
  const toast = useToast();

  const activeConversationId = computed(
    () => conversationStore.activeConversationId ?? '',
  );
  const activeConversation = computed(
    () => conversationStore.getConversation(activeConversationId.value) ?? null,
  );

  /** The model shown/applied: the active conversation's own model wins, then
   *  the globally persisted selection for a fresh (model-less) conversation. */
  const selectedModelName = computed(
    () => activeConversation.value?.model || modelsStore.selectedModel,
  );

  const selectedModelDetails = computed(() =>
    selectedModelName.value
      ? (modelsStore.getModel(selectedModelName.value) ?? null)
      : null,
  );

  const selectedModelCapabilities = computed(() => {
    const caps = selectedModelDetails.value?.capabilities;
    return caps ?? [];
  });

  const isModelAvailable = computed(() => {
    const model = selectedModelName.value;
    if (!model) return null;
    if (modelsStore.modelsLoading) return null;
    if (!modelsStore.models.length) return null;
    return modelsStore.models.some((m) => m.model === model);
  });

  const isModelMissing = computed(() => isModelAvailable.value === false);

  const hasNoModelSelected = computed(() => !selectedModelName.value);

  function changeModel(modelName: string) {
    modelsStore.setSelectedModel(modelName);

    // Opt-in warm-up: pre-load local model weights so the first prompt does
    // not stall on a cold load. Cloud models are served remotely — skip.
    if (appStore.warmModelOnSelect) {
      const origin = modelsStore.getModel(modelName)?.origin;
      if (origin !== 'cloud') void warmModel(modelName);
    }

    if (activeConversationId.value) {
      conversationStore.setModel(activeConversationId.value, modelName);
      const m = modelsStore.getModel(modelName);
      if (m?.context_length) {
        const maxOpt = modelsStore.maxNumCtxForModel(modelName);
        const current = Number(
          conversationStore.getConversation(activeConversationId.value)
            ?.numCtx ?? 0,
        );
        const resolution = resolveNumCtxForModel(
          current,
          m.context_length,
          maxOpt,
        );
        if (resolution.numCtx !== null) {
          conversationStore.setNumCtx(
            activeConversationId.value,
            resolution.numCtx,
          );
          if (resolution.wasClamped) {
            toast.warning(
              i18n.global.t('toast.contextClamped', {
                model: modelName,
                max: modelsStore.formatCtx(m.context_length),
                value: modelsStore.formatCtx(Number(resolution.numCtx)),
              }),
              { key: TOAST_KEY_CONTEXT_CLAMPED },
            );
          }
        }
      }
    }
  }

  return {
    selectedModelName,
    selectedModelDetails,
    selectedModelCapabilities,
    isModelMissing,
    hasNoModelSelected,
    changeModel,
    localModels: computed(() => modelsStore.localModels),
    cloudModels: computed(() => modelsStore.cloudModels),
    modelsLoading: computed(() => modelsStore.modelsLoading),
  };
}
