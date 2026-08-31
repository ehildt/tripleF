<script setup lang="ts">
/**
 * One pdf in the Files panel: the same card shell and header as an image
 * tile (name, include/exclude toggle, remove-all), above the shared media
 * carousel of page thumbnails (scrollable, dot pager — the same gallery
 * slides the assistant response uses). Clicking a slide opens the pdf's own
 * lightbox; the slide's remove action drops that single page.
 */
import { SquaresExclude, Trash2 } from '@lucide/vue';
import { computed, provide } from 'vue';

import { extractStorageImageHash } from '@/components/chat/exchange-list/chat-exchange/exchange-content/assistant-response/composables/helpers/media/extract-storage-image-hash.helper';
import AssistantCarousel from '@/components/chat/exchange-list/chat-exchange/exchange-content/assistant-response/shared/ui/media-carousel/AssistantCarousel.vue';
import IconButton from '@/components/shared/ui/icon-button/IconButton.vue';
import { useLightbox } from '@/components/shared/ui/lightbox/composables/use-lightbox';
import Lightbox from '@/components/shared/ui/lightbox/Lightbox.vue';
import MotionIcon from '@/components/shared/ui/motion-icon/MotionIcon.vue';
import Tooltip from '@/components/shared/ui/tooltip/Tooltip.vue';
import {
  type GalleryItem,
  type HarnessImageClickedHandler,
  harnessImageClickedKey,
  type MediaItem,
} from '@/types/harness-response-data.model';
import type { LightboxImage } from '@/types/lightbox.model';

import type { AttachmentGalleryProps } from './AttachmentGallery.types';

const props = defineProps<AttachmentGalleryProps>();

const emit = defineEmits<{
  toggle: [];
  remove: [];
  removePage: [hash: string];
}>();

/** The pdf's pages as shared carousel slides (storage URL + page title). */
const galleryItems = computed<GalleryItem[]>(() =>
  (props.item.pages ?? []).map((page) => ({
    imageUrl: props.urlForHash(page.hash),
    imageAlt: page.name,
    title: page.name,
  })),
);

/** The pdf's lightbox: prev/next navigates this pdf's pages only. */
const lightbox = useLightbox();

// Tile clicks open this gallery's lightbox — the same inject the assistant
// response galleries use.
provide<HarnessImageClickedHandler>(harnessImageClickedKey, (item) => {
  lightbox.openImages(
    galleryItems.value.map((g): LightboxImage => ({
      url: g.imageUrl,
      title: g.title,
    })),
    item.imageUrl,
  );
});

function onRemovePage(item: MediaItem) {
  if (!('imageUrl' in item)) return;
  const hash = extractStorageImageHash(item.imageUrl);
  if (hash) emit('removePage', hash);
}

function selectIndex(index: number) {
  lightbox.index.value = index;
}
</script>

<template>
  <div
    class="attachment-gallery"
    :class="{ 'attachment-gallery--unselected': !item.isSelected }"
  >
    <div class="attachment-gallery__header">
      <span class="attachment-gallery__name">
        {{ item.name }}
      </span>
      <Tooltip
        :text="
          item.isSelected
            ? $t('common.excludeFromQuery')
            : $t('common.includeInQuery')
        "
      >
        <button
          type="button"
          class="attachment-gallery__toggle"
          :class="{ 'attachment-gallery__toggle--excluded': !item.isSelected }"
          :aria-label="
            item.isSelected
              ? $t('common.excludeFromQuery')
              : $t('common.includeInQuery')
          "
          :aria-pressed="!item.isSelected"
          @click.stop="emit('toggle')"
        >
          <MotionIcon>
            <SquaresExclude class="attachment-gallery__toggle-icon" />
          </MotionIcon>
        </button>
      </Tooltip>
      <IconButton
        size="sm"
        danger
        :title="$t('common.remove')"
        @click.stop="emit('remove')"
      >
        <Trash2 />
      </IconButton>
    </div>
    <div
      class="attachment-gallery__pages"
      :class="{ 'attachment-gallery__pages--unselected': !item.isSelected }"
    >
      <AssistantCarousel
        :items="galleryItems"
        removable
        @remove="onRemovePage"
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
    @select-index="selectIndex"
  />
</template>

<style scoped>
/* Same card shell as the image tile: elevated surface, divider border,
   block margins between siblings in the scroll column. */
.attachment-gallery {
  width: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-divider);
  overflow: hidden;
  flex-shrink: 0;
  transition:
    opacity 250ms ease,
    filter 250ms ease;
}

.attachment-gallery:not(:last-child) {
  margin-block-end: 0.5rem;
}

.attachment-gallery:not(:first-child) {
  margin-block-start: 0.5rem;
}

.attachment-gallery--unselected {
  opacity: 0.6;
}

.attachment-gallery__header {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  padding: var(--spacing-2);
  border-bottom: 1px solid var(--color-divider);
}

.attachment-gallery__name {
  flex: 1 1 0%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-fg-secondary);
}

.attachment-gallery__toggle {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: var(--spacing-0-5);
  border: none;
  background: none;
  color: var(--color-fg-muted);
  cursor: pointer;
  transition: color 0.2s ease;
}

.attachment-gallery__toggle:hover,
.attachment-gallery__toggle--excluded {
  color: var(--color-accent-primary);
}

.attachment-gallery__toggle-icon {
  width: 0.75rem;
  height: 0.75rem;
}

.attachment-gallery__pages {
  padding: var(--spacing-1);
  transition: filter 250ms ease;
}

.attachment-gallery__pages--unselected {
  filter: grayscale(100%);
}
</style>
