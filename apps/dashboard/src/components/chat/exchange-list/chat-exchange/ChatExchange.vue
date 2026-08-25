<script setup lang="ts">
import Lightbox from '@/components/shared/ui/lightbox/Lightbox.vue';

import DocumentPreview from '../../document-preview/DocumentPreview.vue';
import {
  type ChatExchangeEmits,
  useChatExchange,
} from './composables/use-chat-exchange.composable';
import ExchangeCollapsed from './exchange-collapsed/ExchangeCollapsed.vue';
import AddToFilesButton from './exchange-content/assistant-response/shared/ui/add-to-files-button/AddToFilesButton.vue';
import ExchangeContent from './exchange-content/ExchangeContent.vue';
import ExchangeHeader from './exchange-header/ExchangeHeader.vue';
import type { ChatExchangeProps } from './ChatExchange.types';

const props = defineProps<ChatExchangeProps>();

const emit = defineEmits<ChatExchangeEmits>();

const {
  isUser,
  isPending,
  isStreaming,
  isError,
  isDone,
  lightbox,
  documentPreview,
  addToFiles,
  handleCopy,
  handleImageClicked,
  handleDocumentClicked,
  handleSelectIndex,
  handleCancel,
} = useChatExchange(props);
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
        @cancel="handleCancel"
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
        @image-clicked="handleImageClicked"
        @document-clicked="handleDocumentClicked"
      />
    </div>
  </div>

  <Lightbox
    :images="lightbox.images.value"
    :index="lightbox.index.value"
    :active-title="lightbox.activeTitle.value"
    :is-open="lightbox.isOpen.value"
    @close="lightbox.close"
    @prev="lightbox.goPrev"
    @next="lightbox.goNext"
    @select-index="handleSelectIndex"
  >
    <template v-if="addToFiles.canAddToFiles.value" #actions>
      <AddToFilesButton
        :active="addToFiles.isInFiles.value"
        @toggle="addToFiles.toggleAddToFiles"
      />
    </template>
  </Lightbox>

  <DocumentPreview
    :item="documentPreview.item.value"
    :is-open="documentPreview.isOpen.value"
    :is-loading="documentPreview.isLoading.value"
    :error="documentPreview.error.value"
    :html="documentPreview.html.value"
    :text="documentPreview.text.value"
    @close="documentPreview.close"
  />
</template>

<style scoped>
.exchange {
  display: flex;
  gap: var(--spacing-2);
}

.exchange--user {
  justify-content: flex-end;
  /* Extra breathing room before each user prompt. */
  margin-top: var(--spacing-6);
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
