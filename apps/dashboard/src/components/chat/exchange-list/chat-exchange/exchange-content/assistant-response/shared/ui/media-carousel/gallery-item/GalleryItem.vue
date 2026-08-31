<script setup lang="ts">
import { X } from '@lucide/vue';
import { useI18n } from 'vue-i18n';

import AsyncImage from '@/components/shared/ui/async-image/AsyncImage.vue';
import IconButton from '@/components/shared/ui/icon-button/IconButton.vue';
import type { GalleryItem } from '@/types/harness-response-data.model';

import { useAddImageToFiles } from '../../../../composables/use-add-image-to-files.composable';
import { useGalleryImageTile } from '../../../composables/use-gallery-image-tile.composable';
import AddToFilesButton from '../../add-to-files-button/AddToFilesButton.vue';
import MediaCaptionScrim from '../../media-caption-scrim/MediaCaptionScrim.vue';
import MediaCardHeader from '../../media-card-header/MediaCardHeader.vue';

const props = defineProps<{
  item: GalleryItem;
  /** Parent-managed slides (e.g. the attachments gallery) replace the
   * add-to-files action with a remove affordance: such slides are already
   * conversation files, owned by their parent surface. */
  removable?: boolean;
}>();

const emit = defineEmits<{ remove: [] }>();

const { t } = useI18n();
const { src, label, isBroken, open, handleImageError } = useGalleryImageTile(
  props.item,
  t('common.imageFallback'),
);

const { canAddToFiles, isInFiles, toggleAddToFiles } = useAddImageToFiles(
  () => props.item,
);
</script>

<template>
  <li v-if="item.imageUrl" class="harness-gallery__item">
    <figure>
      <button
        type="button"
        class="harness-gallery__trigger"
        :class="{ 'harness-gallery__trigger--error': isBroken }"
        :aria-label="$t('common.viewFullSize', { label })"
        :data-gallery-src="src"
        @click.stop="open"
      >
        <AsyncImage
          :src="src"
          :alt="item.imageAlt || ''"
          @error="handleImageError"
        />
      </button>
      <MediaCaptionScrim
        v-if="item.title || item.caption || canAddToFiles || removable"
        as="figcaption"
        class="harness-gallery__caption"
        :class="{ 'harness-gallery__caption--no-caption': !item.caption }"
      >
        <!-- Header row: the title. Without a caption line the add-to-files
             button joins the actions column here, mirroring the video
             carousel's add-to-playlist placement. -->
        <MediaCardHeader
          :title="
            item.title && item.title !== item.caption ? item.title : undefined
          "
          flush
        >
          <template v-if="removable && !item.caption" #actions>
            <IconButton
              size="sm"
              danger
              :title="$t('common.remove')"
              :aria-label="$t('common.remove')"
              @click.stop="emit('remove')"
            >
              <X />
            </IconButton>
          </template>
          <template v-else-if="canAddToFiles && !item.caption" #actions>
            <AddToFilesButton :active="isInFiles" @toggle="toggleAddToFiles" />
          </template>
        </MediaCardHeader>
        <!-- Caption line with the row action on its right; the row
             only renders when the tile carries a caption. -->
        <div v-if="item.caption" class="harness-gallery__caption-row">
          <p class="harness-gallery__caption-text">{{ item.caption }}</p>
          <IconButton
            v-if="removable"
            size="sm"
            danger
            :title="$t('common.remove')"
            :aria-label="$t('common.remove')"
            @click.stop="emit('remove')"
          >
            <X />
          </IconButton>
          <AddToFilesButton
            v-else-if="canAddToFiles"
            :active="isInFiles"
            @toggle="toggleAddToFiles"
          />
        </div>
      </MediaCaptionScrim>
    </figure>
  </li>
</template>

<style scoped>
.harness-gallery__item figure {
  position: relative;
  margin: 0 auto;
  overflow: hidden;
  background: var(--color-bg-tertiary);
  display: flex;
  flex-direction: column;
  height: 100%;
  height: 360px;
  width: 80%;
}

.harness-gallery__trigger {
  all: unset;
  position: relative;
  display: block;
  width: 100%;
  cursor: zoom-in;
  background: var(--color-bg-tertiary);
  aspect-ratio: 4 / 3;
  flex: 1 1 auto;
  min-height: 180px;
}

.harness-gallery__trigger:focus-visible {
  outline: 2px solid var(--color-accent-primary);
  outline-offset: 2px;
}

.harness-gallery__trigger--error {
  cursor: default;
}

/* Overlay positioning and the scrim live in MediaCaptionScrim; the rules
   below mirror the video carousel's caption bar so the add-to-files button
   sits in the same row as the video gallery's add-to-playlist button. */
.harness-gallery__caption {
  /* Reserve the header row plus one caption line: the bar keeps its height
     whether or not the tile carries a caption, so the add-to-files button
     stays anchored and tiles never shift. */
  min-height: 4.5rem;
}

/* No caption line: the header row (title + add-to-files) pins to the bar's
   bottom edge, so the button sits flush at the image's bottom-right. */
.harness-gallery__caption--no-caption {
  justify-content: flex-end;
}

.harness-gallery__caption-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
}

.harness-gallery__caption-text {
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-fg-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
