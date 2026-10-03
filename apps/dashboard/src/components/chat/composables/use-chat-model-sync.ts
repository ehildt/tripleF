import { computed, watch } from 'vue';

import { TOAST_KEY_MODEL_NO_IMAGES } from '@/composables/toast-keys';
import { useToast } from '@/composables/use-toast';
import { i18n } from '@/i18n/i18n';
import { useConversationStore } from '@/stores/conversation';
import { useModelsStore } from '@/stores/models';

const VISION_CAPABILITY = 'vision';

/**
 * Chat-scoped model capabilities and their side effects on the active
 * conversation: whether the selected model can see images, and the image
 * selection + numCtx sync that keeps the conversation consistent with the
 * model (a non-vision model deselects meta-panel images, a vision model
 * restores them, and a fresh conversation inherits numCtx). Lives here — not
 * in a store — because the derivations are read by the chat orchestrator and
 * the sync logic is component-scoped.
 */
export function useChatModelSync() {
  const conversationStore = useConversationStore();
  const modelsStore = useModelsStore();
  const toast = useToast();

  const activeConversationId = computed(
    () => conversationStore.activeConversationId ?? '',
  );
  const activeConversation = computed(
    () => conversationStore.getConversation(activeConversationId.value) ?? null,
  );

  const selectedModelName = computed(
    () => activeConversation.value?.model || modelsStore.selectedModel,
  );
  const selectedModelDetails = computed(() =>
    selectedModelName.value
      ? (modelsStore.getModel(selectedModelName.value) ?? null)
      : null,
  );

  const hasNoModelSelected = computed(() => !selectedModelName.value);

  const supportsVision = computed(() => {
    const caps = selectedModelDetails.value?.capabilities;
    if (!caps) return true; // allow until model details are loaded
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

  // Keep image selections and numCtx in sync with the active conversation's
  // model: a non-vision model snapshots + deselects meta-panel images, a
  // vision model restores them, and a fresh conversation inherits numCtx.
  watch(
    () => [
      activeConversationId.value,
      selectedModelDetails.value?.model,
      supportsVision.value,
    ],
    () => syncImageSelectionsForVisionState(activeConversationId.value),
  );

  watch(
    () => [activeConversationId.value, selectedModelDetails.value?.model],
    ([, modelName]) =>
      syncNumCtxForModel(activeConversationId.value, modelName as string),
    { immediate: true },
  );

  return {
    hasNoModelSelected,
    supportsVision,
  };
}
