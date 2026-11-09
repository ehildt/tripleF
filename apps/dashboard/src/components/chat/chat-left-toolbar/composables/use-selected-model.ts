import { computed, type ComputedRef } from 'vue';

import { warmModel } from '@/api/warm-model.api';
import { useModelCatalog } from '@/components/app/composables/use-model-catalog';
import { useConversationConfiguration } from '@/components/chat/composables/use-conversation-configuration';
import { useConversationSession } from '@/components/chat/shared/composables/use-conversation-session';
import { TOAST_KEY_CONTEXT_CLAMPED } from '@/composables/toast-keys.constant';
import { useModelWarmingPreference } from '@/composables/use-model-warming-preference/use-model-warming-preference';
import { useToast } from '@/composables/use-toast/use-toast';
import { i18n } from '@/i18n/i18n';
import { useConversationStore } from '@/stores/chat/conversation/conversation.store';
import { useModelsStore } from '@/stores/models/models.store';
import type { OllamaModel } from '@/types/ollama-model.model';
import { formatContextSize } from '@/utils/format-context-size/format-context-size.helper';

import { resolveNumCtxForModel } from '../shared/helpers/resolve-num-ctx-for-model.helper';

interface SelectedModelSurface {
  selectedModelName: ComputedRef<string>;
  selectedModelDetails: ComputedRef<OllamaModel | null>;
  selectedModelCapabilities: ComputedRef<string[]>;
  isModelMissing: ComputedRef<boolean>;
  hasNoModelSelected: ComputedRef<boolean>;
  changeModel: (modelName: string) => void;
}

/**
 * The left toolbar's model-selection surface: selected model, capabilities,
 * availability, and the composed persist/warm-up/context-clamp change action.
 */
export function useSelectedModel(): SelectedModelSurface {
  const conversationStore = useConversationStore();
  const conversationSession = useConversationSession();
  const configuration = useConversationConfiguration();
  const modelCatalog = useModelCatalog();
  const modelsStore = useModelsStore();
  const { warmModelOnSelect } = useModelWarmingPreference();
  const toast = useToast();

  const activeConversationId = computed(
    () => conversationSession.activeConversationId.value ?? '',
  );
  const activeConversation = computed(
    () => conversationStore.getConversation(activeConversationId.value) ?? null,
  );

  /** The active conversation's model wins over the global fresh-chat value. */
  const selectedModelName = computed(
    () => activeConversation.value?.model || modelsStore.selectedModel,
  );

  const selectedModelDetails = computed(() =>
    selectedModelName.value
      ? (modelsStore.getModel(selectedModelName.value) ?? null)
      : null,
  );

  const selectedModelCapabilities = computed(
    () => selectedModelDetails.value?.capabilities ?? [],
  );

  const isModelAvailable = computed(() => {
    const model = selectedModelName.value;
    if (!model) return null;
    if (modelsStore.modelsLoading) return null;
    if (!modelsStore.models.length) return null;
    return modelsStore.models.some((entry) => entry.model === model);
  });

  const isModelMissing = computed(() => isModelAvailable.value === false);
  const hasNoModelSelected = computed(() => !selectedModelName.value);

  function changeModel(modelName: string): void {
    modelCatalog.selectModel(modelName);

    // Only local models need opt-in weight warming; cloud models are remote.
    if (warmModelOnSelect.value) {
      const origin = modelsStore.getModel(modelName)?.origin;
      if (origin !== 'cloud') void warmModel(modelName);
    }

    if (activeConversationId.value) {
      void configuration.setModel(activeConversationId.value, modelName);
      const model = modelsStore.getModel(modelName);
      if (model?.context_length) {
        const maxOpt = modelsStore.maxNumCtxForModel(modelName);
        const current = Number(
          conversationStore.getConversation(activeConversationId.value)
            ?.numCtx ?? 0,
        );
        const resolution = resolveNumCtxForModel(
          current,
          model.context_length,
          maxOpt,
        );
        if (resolution.numCtx !== null) {
          void configuration.setNumCtx(
            activeConversationId.value,
            resolution.numCtx,
          );
          if (resolution.wasClamped) {
            toast.warning(
              i18n.global.t('toast.contextClamped', {
                model: modelName,
                max: formatContextSize(model.context_length),
                value: formatContextSize(Number(resolution.numCtx)),
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
  };
}
