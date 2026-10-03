<script setup lang="ts">
import AttachmentCard from './attachment-card/AttachmentCard.vue';
import type { FilesProps } from './Files.types';

defineProps<FilesProps>();

const emit = defineEmits<{
  remove: [id: string];
  toggle: [id: string];
  removePage: [parentHash: string, pageHash: string];
}>();
</script>

<template>
  <div class="files">
    <AttachmentCard
      v-for="item in attachments"
      :key="item.id"
      :item="item"
      :image-src="previewUrl(item)"
      :url-for-hash="urlForHash"
      @remove="emit('remove', item.id)"
      @toggle="emit('toggle', item.id)"
      @remove-page="(hash) => emit('removePage', item.hash, hash)"
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
