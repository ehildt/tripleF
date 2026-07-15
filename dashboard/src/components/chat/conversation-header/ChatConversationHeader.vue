<script setup lang="ts">
import {
  LoaderCircle,
  MessagesSquare,
  PenLine,
  Pin,
  PinOff,
  Shrink,
  Trash2,
} from '@lucide/vue';
import { computed, nextTick, ref, watch } from 'vue';

import { useConversationStore } from '@/stores/conversation';

import { calcTotalContextPercentage } from '../shared/helpers/calc-token-percent.helper';

const props = defineProps<{
  title: string;
  conversationId: string;
  count?: number;
}>();

const emit = defineEmits<{
  delete: [id: string];
}>();

const conversationStore = useConversationStore();

const tokenPercent = computed(() => {
  const conversation = conversationStore.getConversation(props.conversationId);
  if (!conversation) return null;
  return calcTotalContextPercentage(
    conversation.exchanges,
    conversation.numCtx ?? '',
  );
});

const conversationType = computed(() => {
  const conversation = conversationStore.getConversation(props.conversationId);
  return conversation?.type ?? 'temporary';
});

function toggleType() {
  conversationStore.toggleConversationType(props.conversationId);
}

const editing = ref(false);
const editTitle = ref('');

watch(
  () => props.title,
  (t) => {
    editTitle.value = t;
  },
  { immediate: true },
);

function startRename() {
  editing.value = true;
  nextTick(() => {
    const input = document.querySelector<HTMLInputElement>(
      '[data-rename-input]',
    );
    input?.focus();
    input?.select();
  });
}

function commitRename() {
  if (editTitle.value.trim()) {
    conversationStore.renameConversation(
      props.conversationId,
      editTitle.value.trim(),
    );
  }
  editing.value = false;
}

function onRenameKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') commitRename();
  else if (e.key === 'Escape') editing.value = false;
}

function onDelete() {
  emit('delete', props.conversationId);
}
</script>

<template>
  <div
    class="px-4 py-3 bg-secondary border-b border-divider flex items-center gap-2 font-mono"
  >
    <MessagesSquare class="w-4 h-4 text-tab-rest shrink-0" />
    <input
      v-if="editing"
      v-model="editTitle"
      data-rename-input
      class="flex-1 min-w-0 px-1 py-0 bg-secondary border border-divider text-sm text-fg-primary font-mono focus:outline-none focus:border-tab-rest"
      @keydown="onRenameKeydown"
      @blur="commitRename"
    />
    <span v-else class="text-sm text-tab-rest flex-1 truncate">{{
      title
    }}</span>

    <div class="flex items-center gap-1.5">
      <span
        class="text-xs leading-none font-mono"
        :class="
          tokenPercent != null && Number(tokenPercent) > 80
            ? 'text-status-error'
            : tokenPercent != null && Number(tokenPercent) > 50
              ? 'text-status-warning'
              : 'text-tab-debug'
        "
      >
        {{ tokenPercent != null ? `${tokenPercent}%` : '--' }}
      </span>
    </div>

    <button
      class="p-1 text-fg-muted hover:text-tab-rest transition-colors cursor-pointer"
      title="Rename"
      @click="startRename"
    >
      <PenLine class="w-3.5 h-3.5" />
    </button>

    <button
      class="p-1 text-fg-muted hover:text-status-error transition-colors cursor-pointer"
      title="Delete conversation"
      @click="onDelete"
    >
      <Trash2 class="w-3.5 h-3.5" />
    </button>

    <button
      class="p-1 text-fg-muted hover:text-tab-rest transition-colors cursor-pointer"
      :title="
        conversationType === 'temporary'
          ? 'Pin to persistent'
          : 'Unpin to temporary'
      "
      @click="toggleType"
    >
      <PinOff v-if="conversationType === 'temporary'" class="w-3.5 h-3.5" />
      <Pin v-else class="w-3.5 h-3.5" />
    </button>

    <button
      class="p-1 transition-colors cursor-pointer"
      :class="
        conversationStore.compacting
          ? 'text-fg-muted cursor-default'
          : 'text-fg-muted hover:text-tab-accent'
      "
      :title="conversationStore.compacting ? 'Compacting...' : 'Compact'"
      :disabled="conversationStore.compacting"
      @click="conversationStore.compactExchanges(conversationId)"
    >
      <LoaderCircle
        v-if="conversationStore.compacting"
        class="w-3.5 h-3.5 animate-spin"
      />
      <Shrink v-else class="w-3.5 h-3.5" />
    </button>
  </div>
</template>
