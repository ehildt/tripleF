<script setup lang="ts">
/**
 * One file card in the Files panel: name header with the include/exclude
 * toggle (mirroring the history items' control) and a trash remove button,
 * above a thumbnail whose overlay shows the upload-source indicator.
 */
import {
  Cloud,
  CloudDownload,
  FileText,
  SquaresExclude,
  Trash2,
} from '@lucide/vue';
import { computed } from 'vue';

import IconButton from '../../../shared/ui/icon-button/IconButton.vue';
import MotionIcon from '../../../shared/ui/motion-icon/MotionIcon.vue';
import Tooltip from '../../../shared/ui/tooltip/Tooltip.vue';
import type { AttachmentItem } from '../composables/use-attachment-list.types';

const props = defineProps<{
  item: AttachmentItem;
  imageSrc: string;
}>();

const emit = defineEmits<{
  remove: [];
  toggle: [];
}>();

const sourceIcon = computed(() =>
  props.item.source === 'cloud' ? CloudDownload : Cloud,
);

const isDocument = computed(() => props.item.kind === 'document');

const sourceTitle = computed(() =>
  props.item.source === 'cloud'
    ? 'Downloaded from the web'
    : 'Uploaded by the user',
);
</script>

<template>
  <div
    class="attachment-card"
    :class="{ 'attachment-card--unselected': !item.isSelected }"
  >
    <div class="attachment-card__header">
      <span class="attachment-card__name">
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
          class="attachment-card__toggle"
          :class="{ 'attachment-card__toggle--excluded': !item.isSelected }"
          :aria-label="
            item.isSelected
              ? $t('common.excludeFromQuery')
              : $t('common.includeInQuery')
          "
          :aria-pressed="!item.isSelected"
          @click.stop="emit('toggle')"
        >
          <MotionIcon>
            <SquaresExclude class="attachment-card__toggle-icon" />
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
      class="attachment-card__thumb"
      :class="{ 'attachment-card__thumb--unselected': !item.isSelected }"
    >
      <img
        v-if="!isDocument"
        :src="imageSrc"
        class="attachment-card__image"
        :class="{ 'attachment-card__image--unselected': !item.isSelected }"
        alt=""
        loading="lazy"
        decoding="async"
      />
      <div v-else class="attachment-card__document">
        <FileText
          class="attachment-card__document-icon"
          :aria-label="$t('common.documentFile')"
        />
      </div>
      <Tooltip :text="sourceTitle">
        <span class="attachment-card__source">
          <component :is="sourceIcon" class="attachment-card__source-icon" />
        </span>
      </Tooltip>
    </div>
  </div>
</template>

<style scoped>
.attachment-card {
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

.attachment-card:not(:last-child) {
  margin-block-end: 0.5rem;
}

.attachment-card:not(:first-child) {
  margin-block-start: 0.5rem;
}

.attachment-card--unselected {
  opacity: 0.6;
}

.attachment-card__header {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  padding: var(--spacing-2);
  border-bottom: 1px solid var(--color-divider);
}

.attachment-card__name {
  flex: 1 1 0%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-fg-secondary);
}

.attachment-card__toggle {
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

.attachment-card__toggle:hover,
.attachment-card__toggle--excluded {
  color: var(--color-accent-primary);
}

.attachment-card__toggle-icon {
  width: 0.75rem;
  height: 0.75rem;
}

.attachment-card__thumb {
  position: relative;
  transition: filter 250ms ease;
}

.attachment-card__thumb--unselected,
.attachment-card__thumb--unselected .attachment-card__image {
  filter: grayscale(100%);
}

.attachment-card__image {
  width: 100%;
  height: 20dvh;
  object-fit: cover;
  display: block;
  transition: filter 250ms ease;
}

.attachment-card__document {
  width: 100%;
  height: 20dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: color-mix(
    in srgb,
    var(--color-accent-primary) 6%,
    transparent
  );
}

.attachment-card__document-icon {
  width: 2rem;
  height: 2rem;
  color: var(--color-fg-muted);
}

.attachment-card__image--unselected {
  filter: grayscale(100%);
}

/* Upload-source indicator pinned to the thumbnail's top-right corner: a
   frosted-glass chip at 0.85 opacity, no border, no radius. */
.attachment-card__source {
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

.attachment-card__source-icon {
  width: 0.75rem;
  height: 0.75rem;
}
</style>
