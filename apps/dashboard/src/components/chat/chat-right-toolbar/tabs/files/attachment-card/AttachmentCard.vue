<script setup lang="ts">
/**
 * One attachment tile in the Files panel, dispatched by the item's kind:
 * a pdf renders as a page gallery (AttachmentGallery), a non-pdf document as
 * a playlist-style row (AttachmentDocumentRow), and an image as the classic
 * card (AttachmentImageCard).
 */
import { computed } from 'vue';

import AttachmentDocumentRow from './attachment-document-row/AttachmentDocumentRow.vue';
import AttachmentGallery from './attachment-gallery/AttachmentGallery.vue';
import AttachmentImageCard from './attachment-image-card/AttachmentImageCard.vue';
import type { AttachmentCardProps } from './AttachmentCard.types';

const props = defineProps<AttachmentCardProps>();

const emit = defineEmits<{
  remove: [];
  toggle: [];
  removePage: [hash: string];
}>();

/**
 * The document-shaped view of the entry (null for image/gallery kinds).
 * Vue can't narrow a union-typed `kind` prop across template branch chains,
 * so the document row renders from this explicit computed instead of an
 * inline branch on `item.kind`.
 */
const documentItem = computed(() =>
  props.item.kind === 'document'
    ? { ...props.item, kind: 'document' as const }
    : null,
);
</script>

<template>
  <AttachmentGallery
    v-if="item.kind === 'gallery'"
    :item="item"
    :url-for-hash="urlForHash"
    @toggle="emit('toggle')"
    @remove="emit('remove')"
    @remove-page="(hash) => emit('removePage', hash)"
  />
  <AttachmentDocumentRow
    v-else-if="documentItem"
    :item="documentItem"
    @toggle="emit('toggle')"
    @remove="emit('remove')"
  />
  <AttachmentImageCard
    v-else
    :item="item"
    :image-src="imageSrc"
    @toggle="emit('toggle')"
    @remove="emit('remove')"
  />
</template>
