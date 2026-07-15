<script setup lang="ts">
import { useClipboard } from '@vueuse/core';
import { computed } from 'vue';

import type { Exchange } from '@/stores/conversation';
import { useConversationStore } from '@/stores/conversation';

import { useToast } from '../../../../composables/use-toast';
import { useAppStore } from '../../../../stores/app';
import { useExchangeLightbox } from './composables/use-exchange-lightbox';
import ExchangeCollapsed from './exchange-collapsed/ExchangeCollapsed.vue';
import ExchangeContent from './exchange-content/ExchangeContent.vue';
import ExchangeHeader from './exchange-header/ExchangeHeader.vue';
import ExchangeLightbox from './exchange-lightbox/ExchangeLightbox.vue';

const props = defineProps<{
  exchange: Exchange;
  highlighted?: boolean;
  collapsed?: boolean;
}>();

const emit = defineEmits<{
  (e: 'delete', exchangeId: string): void;
  (e: 'retry', exchangeId: string): void;
  (e: 'branch', exchangeId: string): void;
  (e: 'hover-delete-start', exchangeId: string): void;
  (e: 'hover-delete-end'): void;
}>();

const appStore = useAppStore();
const conversationStore = useConversationStore();

const isUser = computed(() => props.exchange.role === 'user');
const isPending = computed(() => props.exchange.status === 'pending');
const isStreaming = computed(() => props.exchange.status === 'streaming');
const isError = computed(() => props.exchange.status === 'error');
const isDone = computed(() => props.exchange.status === 'done');
const isCompacting = computed(() => conversationStore.compacting);

const toast = useToast();
const { copy } = useClipboard({ legacy: true });
const lightbox = useExchangeLightbox();

async function handleCopy() {
  await copy(props.exchange.content);
  toast.success('Copied to clipboard');
}

function handleImageClicked(
  items: { url: string; title?: string }[],
  clickedUrl: string,
) {
  lightbox.openImages(items, clickedUrl);
}

function handleSelectIndex(i: number) {
  lightbox.index.value = i;
}

function handleToggleIncluded() {
  if (conversationStore.activeConversationId) {
    conversationStore.toggleExchangeIncluded(
      conversationStore.activeConversationId,
      props.exchange.id,
    );
  }
}

function handleCancel(requestId: string) {
  appStore.abortJob(requestId);
}
</script>

<template>
  <div
    class="exchange"
    :class="isUser ? 'exchange--user' : 'exchange--assistant'"
  >
    <div
      class="exchange__column"
      :class="[
        isUser ? 'exchange__column--user' : 'exchange__column--assistant',
        collapsed ? 'exchange__column--collapsed' : '',
      ]"
    >
      <ExchangeHeader
        :exchange="exchange"
        :is-user="isUser"
        :is-done="isDone"
        :is-error="isError"
        :is-pending="isPending"
        :is-streaming="isStreaming"
        @copy="handleCopy"
        @retry="emit('retry', exchange.id)"
        @branch="emit('branch', exchange.id)"
        @delete="emit('delete', exchange.id)"
        @toggle-included="handleToggleIncluded"
        @cancel="handleCancel"
        @hover-delete-start="emit('hover-delete-start', exchange.id)"
        @hover-delete-end="emit('hover-delete-end')"
      />

      <ExchangeCollapsed
        v-if="collapsed"
        :exchange="exchange"
        :is-user="isUser"
      />
      <ExchangeContent
        v-else
        :exchange="exchange"
        :is-user="isUser"
        :is-error="isError"
        :is-pending="isPending"
        :is-streaming="isStreaming"
        :is-highlighted="highlighted"
        :is-compacting="isCompacting"
        @image-clicked="handleImageClicked"
      />
    </div>
  </div>

  <ExchangeLightbox
    :images="lightbox.images.value"
    :index="lightbox.index.value"
    :active-title="lightbox.activeTitle.value"
    :is-open="lightbox.isOpen.value"
    @close="lightbox.close"
    @prev="lightbox.goPrev"
    @next="lightbox.goNext"
    @select-index="handleSelectIndex"
  />
</template>

<style scoped>
.exchange {
  display: flex;
  gap: var(--spacing-2);
}

.exchange--user {
  justify-content: flex-end;
}

.exchange--assistant {
  justify-content: flex-start;
}

.exchange__column {
  display: flex;
  flex-direction: column;
}

.exchange__column--user {
  max-width: 85%;
}

.exchange__column--assistant {
  max-width: 100%;
  width: 100%;
  min-width: 0;
}

.exchange__column--collapsed {
  width: 100%;
}
</style>
