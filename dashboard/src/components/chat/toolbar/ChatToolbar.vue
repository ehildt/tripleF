<script setup lang="ts">
import { onClickOutside } from '@vueuse/core';
import { computed, inject, onMounted, provide, ref, watch } from 'vue';

import { useConversationStore } from '@/stores/conversation';

import { useBlink } from '../../../composables/use-blink';
import { useAppStore } from '../../../stores/app';
import { useModelsStore } from '../../../stores/models';
import CapabilitiesRow from './capabilities-row/CapabilitiesRow.vue';
import ConversationList from './conversation-list/ConversationList.vue';
import ModelSelector from './model-selector/ModelSelector.vue';
import NewConversationMenu from './new-conversation-menu/NewConversationMenu.vue';
import { useAttachedFiles } from './shared/composables/use-attached-files';
import { useConversationList } from './shared/composables/use-conversation-list';
import { useEventSubscriptions } from './shared/composables/use-event-subscriptions';
import { useExclusiveMenu } from './shared/composables/use-exclusive-menu';
import { useSelectedModel } from './shared/composables/use-selected-model';
import { useStreamSettings } from './shared/composables/use-stream-settings';
import StreamSettingsMenu from './stream-settings-menu/StreamSettingsMenu.vue';
import SubscribedEventsList from './subscribed-events-list/SubscribedEventsList.vue';

const VISION_CAPABILITY = 'vision';

const props = defineProps<{ chatActive: boolean; promptFocused: boolean }>();

const conversationStore = useConversationStore();
const modelsStore = useModelsStore();
const appStore = useAppStore();

/** Sysctl toggle: hide the sockets menu + subscribed list from the toolbar. */
const areSocketsVisible = computed(() => appStore.isTabVisible('sockets'));

// ── Menu coordination ─────────────────────────────────────
const { isMenuOpen, toggleMenu, closeAllMenus } = useExclusiveMenu();

watch(
  () => props.chatActive,
  (active) => {
    if (!active) closeAllMenus();
  },
);

// ── Model selection ───────────────────────────────────────
const {
  conversationId,
  conversation,
  selectedModel,
  isModelAvailable,
  selectedModelDetails,
  hasNoModelSelected,
  changeModel,
} = useSelectedModel();

const supportsVision = computed(() => {
  const caps = selectedModelDetails.value?.capabilities;
  if (!caps) return true; // allow until model details are loaded
  return caps.includes(VISION_CAPABILITY);
});

// Deselect meta-panel images when the selected model lacks vision.
watch([conversationId, supportsVision], ([sid]) => {
  if (!sid) return;
  const s = conversationStore.getConversation(sid);
  if (!s) return;

  if (
    supportsVision.value &&
    Object.keys(s.imageSelectionSnapshot).length > 0
  ) {
    conversationStore.restoreImageSelections(sid);
    s.imageSelectionSnapshot = {};
  }

  if (Object.keys(s.imageSelectionSnapshot).length > 0) return;

  conversationStore.snapshotImageSelections(sid);
  conversationStore.deselectAllImages(sid);
});

watch([conversationId, supportsVision], ([sid]) => {
  if (!sid) return;
  const s = conversationStore.getConversation(sid);
  if (!s) return;

  if (
    supportsVision.value &&
    Object.keys(s.imageSelectionSnapshot).length > 0
  ) {
    conversationStore.restoreImageSelections(sid);
    s.imageSelectionSnapshot = {};
    return;
  }

  if (Object.keys(s.imageSelectionSnapshot).length > 0) return;
  conversationStore.snapshotImageSelections(sid);
  conversationStore.deselectAllImages(sid);
});

function toggleModelMenu() {
  const wasOpen = isMenuOpen('model').value;
  closeAllMenus();
  if (!wasOpen) {
    toggleMenu('model');
    modelsStore.fetchModels(true);
  }
}

// ── Conversation list ──────────────────────────────────────────
const {
  isConversationListExpanded,
  newConversationName,
  newConversationSocketBinding,
  switchToConversation,
  deleteConversation,
  createNewConversation,
} = useConversationList();

function toggleNewConversationMenu() {
  if (hasNoModelSelected.value) return;
  const wasOpen = isMenuOpen('newSession').value;
  closeAllMenus();
  if (wasOpen) return;
  toggleMenu('newSession');
  if (!modelsStore.models.length) modelsStore.fetchModels(true);
}

// ── NumCtx ────────────────────────────────────────────────
const allNumCtxOptions = computed(() => modelsStore.numCtxOptions.map(String));
const filteredNumCtxOptions = computed(() => {
  if (modelsStore.modelsLoading) return [];
  const ctx = selectedModelDetails.value?.context_length;
  if (!ctx) return allNumCtxOptions.value;
  return allNumCtxOptions.value.filter((opt) => Number(opt) <= ctx);
});

const conversationNumCtx = computed(() => {
  return conversationStore.getConversation(conversationId.value)?.numCtx || '';
});

const defaultNumCtx = computed(() => {
  return filteredNumCtxOptions.value.at(-1) || modelsStore.defaultNumCtx || '';
});

function selectNumCtx(ctx: string) {
  let sid = conversationId.value;
  if (!sid) {
    const conversation = conversationStore.ensureConversation();
    sid = conversation.id;
  }
  const maxCtx = selectedModelDetails.value?.context_length;
  if (maxCtx && Number(ctx) > maxCtx) ctx = String(maxCtx);

  conversationStore.setNumCtx(sid, ctx);
}

// ── Stream settings ───────────────────────────────────────
const { isStreamEnabled, newSubscriptionEvent, newSubscriptionRoomId } =
  useStreamSettings();

function toggleStreamSettingsMenu() {
  if (hasNoModelSelected.value) return;
  const wasOpen = isMenuOpen('streamSettings').value;
  closeAllMenus();
  if (!wasOpen) {
    toggleMenu('streamSettings');
  }
}

// ── Event subscriptions ────────────────────────────────────
const {
  subscriptions,
  isSubscriptionListExpanded,
  availableSocketBindings,
  conversationNamesByEvent,
  subscribeToEvent,
  toggleSubscriptionActive,
  toggleSubscriptionStream,
  removeSubscription,
  mergeSubscriptionsFromSessions,
  reconnectActiveSubscriptions,
} = useEventSubscriptions();

// ── Blink triggers (for disabled-button feedback) ──────────
const brainBlink = inject('brainBlink') as ReturnType<typeof useBlink>;
const streamBlink = useBlink(1500);
const conversationsBlink = useBlink(1500);
provide('blinkStream', streamBlink.blink);
provide('blinkConversations', conversationsBlink.blink);

// ── Attached files ────────────────────────────────────────
const {
  attachedFiles,
  fileInputRef,
  selectedFiles,
  onFileInputChange,
  removeAttachedFile,
  toggleAttachedFile,
  loadSessionFiles,
} = useAttachedFiles();

// ── Outside click ─────────────────────────────────────────
const toolbarRef = ref<HTMLElement | null>(null);

onClickOutside(toolbarRef, closeAllMenus);

// ── Lifecycle ─────────────────────────────────────────────
onMounted(() => {
  loadSessionFiles();
  mergeSubscriptionsFromSessions();
  reconnectActiveSubscriptions();
});

// ── Expose for parent (Chat.vue) ───────────────────
defineExpose({
  selectedFiles: attachedFiles,
  fileInputRef,
  handleFileSelect: onFileInputChange,
  removeFile: removeAttachedFile,
  toggleFileSelected: toggleAttachedFile,
  activeFiles: selectedFiles,
  selectedModel,
  supportsVision,
  deleteConversation,
});
</script>

<template>
  <div ref="toolbarRef" class="chat-toolbar">
    <div class="chat-toolbar__group">
      <!-- Model / Brain -->
      <ModelSelector
        :is-open="isMenuOpen('model').value"
        :selected-model-name="conversation?.model || selectedModel || '—'"
        :is-model-missing="isModelAvailable === false"
        :models="modelsStore.models"
        :is-loading="modelsStore.modelsLoading"
        @toggle-menu="toggleModelMenu"
        @select-model="changeModel"
      />

      <!-- Capabilities -->
      <CapabilitiesRow
        v-if="selectedModelDetails?.capabilities?.length"
        :capabilities="selectedModelDetails.capabilities"
      />
    </div>

    <div class="chat-toolbar__group">
      <!-- New Conversation -->
      <NewConversationMenu
        :is-open="isMenuOpen('newSession').value"
        :is-disabled="hasNoModelSelected"
        :new-conversation-name="newConversationName"
        :new-conversation-socket-binding="newConversationSocketBinding"
        :available-socket-bindings="availableSocketBindings"
        :filtered-num-ctx-options="filteredNumCtxOptions"
        :current-num-ctx="conversationNumCtx || defaultNumCtx"
        :default-num-ctx="defaultNumCtx"
        :format-ctx="(n: number) => modelsStore.formatCtx(n)"
        :blinking="conversationsBlink.isBlinking"
        :on-mouse-enter="brainBlink?.start"
        :on-mouse-leave="brainBlink?.stop"
        @toggle-menu="toggleNewConversationMenu"
        @update:new-conversation-name="newConversationName = $event"
        @update:new-conversation-socket-binding="
          newConversationSocketBinding = $event
        "
        @create-conversation="
          createNewConversation(
            $event,
            newConversationName,
            newConversationSocketBinding,
          )
        "
        @select-num-ctx="selectNumCtx"
      />

      <!-- Conversations list -->
      <ConversationList
        v-if="conversationStore.conversations.length"
        class="chat-toolbar__list"
        :conversations="conversationStore.conversations"
        :active-conversation-id="conversationStore.activeConversationId"
        :is-expanded="isConversationListExpanded"
        @toggle-expanded="
          isConversationListExpanded = !isConversationListExpanded
        "
        @select-conversation="switchToConversation"
        @delete-conversation="deleteConversation"
      />
    </div>

    <div v-if="areSocketsVisible" class="chat-toolbar__group">
      <!-- Stream / Subscribe -->
      <StreamSettingsMenu
        class="chat-toolbar__list"
        :is-open="isMenuOpen('streamSettings').value"
        :is-disabled="hasNoModelSelected"
        :is-stream-enabled="isStreamEnabled"
        :new-event="newSubscriptionEvent"
        :new-room-id="newSubscriptionRoomId"
        :blinking="streamBlink.isBlinking"
        :on-mouse-enter="brainBlink?.start"
        :on-mouse-leave="brainBlink?.stop"
        @toggle-menu="toggleStreamSettingsMenu"
        @update:is-stream-enabled="isStreamEnabled = $event"
        @update:new-event="newSubscriptionEvent = $event"
        @update:new-room-id="newSubscriptionRoomId = $event"
        @subscribe-to-event="
          subscribeToEvent(newSubscriptionEvent, newSubscriptionRoomId)
        "
      />

      <!-- Subscribed events list -->
      <SubscribedEventsList
        v-if="subscriptions.length"
        class="chat-toolbar__list"
        :subscriptions="subscriptions"
        :is-expanded="isSubscriptionListExpanded"
        :conversation-names-by-event="conversationNamesByEvent"
        @toggle-expanded="
          isSubscriptionListExpanded = !isSubscriptionListExpanded
        "
        @toggle-active="toggleSubscriptionActive"
        @toggle-stream="toggleSubscriptionStream"
        @remove-subscription="removeSubscription"
      />
    </div>

    <input
      ref="fileInputRef"
      type="file"
      multiple
      accept="image/*"
      class="hidden"
      @change="onFileInputChange"
    />
  </div>
</template>

<style scoped>
.chat-toolbar {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--spacing-2);
  padding-top: var(--spacing-2);
}

.chat-toolbar__group {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  width: 100%;
}

.chat-toolbar__list {
  width: 100%;
}
</style>
