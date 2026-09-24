<script setup lang="ts">
/**
 * One image attachment in the Files panel: a name header with the
 * include/exclude toggle (mirroring the history items' control) and a trash
 * remove button, above a thumbnail whose overlay shows the upload-source
 * indicator.
 */
import { Cloud, CloudDownload, SquaresExclude, Trash2 } from '@lucide/vue';
import { computed } from 'vue';

import IconButton from '@/components/shared/ui/icon-button/IconButton.vue';
import MotionIcon from '@/components/shared/ui/motion-icon/MotionIcon.vue';
import Tooltip from '@/components/shared/ui/tooltip/Tooltip.vue';

import type { AttachmentImageCardProps } from './AttachmentImageCard.types';

const props = defineProps<AttachmentImageCardProps>();

const emit = defineEmits<{
  toggle: [];
  remove: [];
}>();

const sourceIcon = computed(() =>
  props.item.source === 'cloud' ? CloudDownload : Cloud,
);

const sourceTitleKey = computed(() =>
  props.item.source === 'cloud'
    ? 'common.downloadedFromWeb'
    : 'common.uploadedByUser',
);
</script>

<template>
  <div
    class="attachment-image-card"
    :class="{ 'attachment-image-card--unselected': !item.isSelected }"
  >
    <div class="attachment-image-card__header">
      <span class="attachment-image-card__name">
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
          class="attachment-image-card__toggle"
          :class="{
            'attachment-image-card__toggle--excluded': !item.isSelected,
          }"
          :aria-label="
            item.isSelected
              ? $t('common.excludeFromQuery')
              : $t('common.includeInQuery')
          "
          :aria-pressed="!item.isSelected"
          @click.stop="emit('toggle')"
        >
          <MotionIcon>
            <SquaresExclude class="attachment-image-card__toggle-icon" />
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
      class="attachment-image-card__thumb"
      :class="{ 'attachment-image-card__thumb--unselected': !item.isSelected }"
    >
      <img
        :src="imageSrc"
        class="attachment-image-card__image"
        :class="{
          'attachment-image-card__image--unselected': !item.isSelected,
        }"
        alt=""
        loading="lazy"
        decoding="async"
      />
      <Tooltip :text="$t(sourceTitleKey)">
        <span class="attachment-image-card__source">
          <component
            :is="sourceIcon"
            class="attachment-image-card__source-icon"
          />
        </span>
      </Tooltip>
    </div>
  </div>
</template>

<style scoped>
.attachment-image-card {
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

.attachment-image-card:not(:last-child) {
  margin-block-end: var(--spacing-2);
}

.attachment-image-card:not(:first-child) {
  margin-block-start: var(--spacing-2);
}

.attachment-image-card--unselected {
  opacity: 0.6;
}

.attachment-image-card__header {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  padding: var(--spacing-2);
  border-bottom: 1px solid var(--color-divider);
}

.attachment-image-card__name {
  flex: 1 1 0%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-fg-secondary);
}

.attachment-image-card__toggle {
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

.attachment-image-card__toggle:hover,
.attachment-image-card__toggle--excluded {
  color: var(--color-accent-primary);
}

.attachment-image-card__toggle-icon {
  width: 0.75rem;
  height: 0.75rem;
}

.attachment-image-card__thumb {
  position: relative;
  transition: filter 250ms ease;
}

.attachment-image-card__thumb--unselected,
.attachment-image-card__thumb--unselected .attachment-image-card__image {
  filter: grayscale(100%);
}

.attachment-image-card__image {
  width: 100%;
  height: 20dvh;
  object-fit: cover;
  display: block;
  transition: filter 250ms ease;
}

.attachment-image-card__image--unselected {
  filter: grayscale(100%);
}

/* Upload-source indicator pinned to the thumbnail's top-right corner: a
   frosted-glass chip at 0.85 opacity, no border, no radius. */
.attachment-image-card__source {
  position: absolute;
  top: var(--spacing-1);
  right: var(--spacing-1);
  display: flex;
  align-items: center;
  padding: var(--spacing-0-5);
  background: color-mix(in srgb, var(--color-bg-primary) 85%, transparent);
  backdrop-filter: blur(4px);
  color: var(--color-accent-primary);
  opacity: 0.85;
}

.attachment-image-card__source-icon {
  width: 0.75rem;
  height: 0.75rem;
}
</style>
