<script setup lang="ts">
import { useRightToolbarStore } from '@/stores/right-toolbar';

import AttachmentCard from './attachment-card/AttachmentCard.vue';

const toolbarStore = useRightToolbarStore();
</script>

<template>
  <div class="files">
    <AttachmentCard
      v-for="item in toolbarStore.attachments"
      :key="item.id"
      :item="item"
      :image-src="toolbarStore.previewUrl(item)"
      :url-for-hash="toolbarStore.previewUrlForHash"
      @remove="toolbarStore.removeAttachment(item.id)"
      @toggle="toolbarStore.toggleAttachment(item.id)"
      @remove-page="(hash) => toolbarStore.removePage(item.hash, hash)"
    />
  </div>
</template>

<style scoped>
.files {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}
</style>
