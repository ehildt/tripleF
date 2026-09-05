<script setup lang="ts">
/**
 * One non-pdf document in the Files panel, styled like a playlist row: the
 * file name and size on the left, an include/exclude toggle and a remove
 * button on the right. Documents carry no rendered content, so the row shows
 * no preview and opens no lightbox.
 */
import { ListMinus, SquaresExclude } from '@lucide/vue';
import { computed } from 'vue';

import IconButton from '@/components/shared/ui/icon-button/IconButton.vue';
import MotionIcon from '@/components/shared/ui/motion-icon/MotionIcon.vue';
import Tooltip from '@/components/shared/ui/tooltip/Tooltip.vue';
import { formatFileSize } from '@/helpers/format-file-size.helper';

import type { AttachmentDocumentRowProps } from './AttachmentDocumentRow.types';

const props = defineProps<AttachmentDocumentRowProps>();

const emit = defineEmits<{
  toggle: [];
  remove: [];
}>();

const metaLine = computed(() => formatFileSize(props.item.size));
</script>

<template>
  <div
    class="attachment-document-row"
    :class="{ 'attachment-document-row--unselected': !item.isSelected }"
  >
    <div class="attachment-document-row__text">
      <span class="attachment-document-row__title">{{ item.name }}</span>
      <span v-if="metaLine" class="attachment-document-row__meta">
        {{ metaLine }}
      </span>
    </div>
    <Tooltip
      :text="
        item.isSelected
          ? $t('common.excludeFromQuery')
          : $t('common.includeInQuery')
      "
    >
      <button
        type="button"
        class="attachment-document-row__toggle"
        :class="{
          'attachment-document-row__toggle--excluded': !item.isSelected,
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
          <SquaresExclude class="attachment-document-row__toggle-icon" />
        </MotionIcon>
      </button>
    </Tooltip>
    <IconButton
      size="sm"
      danger
      :title="$t('common.remove')"
      :aria-label="$t('common.remove')"
      @click.stop="emit('remove')"
    >
      <ListMinus />
    </IconButton>
  </div>
</template>

<style scoped>
.attachment-document-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  padding: var(--spacing-1) var(--spacing-1-5);
  border: 1px solid var(--color-divider);
  background-color: var(--color-bg-secondary);
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    opacity 250ms ease;
}

.attachment-document-row:not(:last-child) {
  margin-block-end: 0.5rem;
}

.attachment-document-row:not(:first-child) {
  margin-block-start: 0.5rem;
}

.attachment-document-row:hover {
  border-color: var(--color-accent-border);
  background-color: color-mix(
    in srgb,
    var(--color-bg-secondary) 85%,
    var(--color-accent-primary)
  );
}

.attachment-document-row--unselected {
  opacity: 0.6;
}

.attachment-document-row__text {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
  flex: 1;
}

.attachment-document-row__title {
  font-size: 0.625rem;
  font-family: var(--font-mono);
  color: var(--color-fg-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachment-document-row__meta {
  font-size: 0.625rem;
  font-family: var(--font-mono);
  color: var(--color-fg-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachment-document-row__toggle {
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

.attachment-document-row__toggle:hover,
.attachment-document-row__toggle--excluded {
  color: var(--color-accent-primary);
}

.attachment-document-row__toggle-icon {
  width: 0.75rem;
  height: 0.75rem;
}
</style>
