<script setup lang="ts">
/**
 * Header row of a media surface card: the title (truncated to one line by
 * default, or clamped to two for hero titles) linking to its source, with a
 * trailing actions column (info toggle, playlist toggle) on the right. Used
 * by the video gallery cards, the carousel caption bar, and the hero media
 * card. The actions slot is optional and hidden when empty.
 */
import { computed } from 'vue';

import Tooltip from '@/components/shared/ui/tooltip/Tooltip.vue';

import type { MediaCardHeaderProps } from './MediaCardHeader.types';

const props = withDefaults(defineProps<MediaCardHeaderProps>(), {
  title: undefined,
  url: undefined,
  clamp: 1,
  tooltip: false,
  flush: false,
});

const titleClasses = computed(() => ({
  'media-card-header__title--clamp-2': props.clamp === 2,
}));
</script>

<template>
  <div class="media-card-header" :class="{ 'media-card-header--flush': flush }">
    <!-- Tooltip is display:contents and disabled unless asked for, so the
         title element always sits directly in the flex row. -->
    <Tooltip :text="title ?? ''" :max-width="'280px'" :disabled="!tooltip">
      <component
        :is="url ? 'a' : 'span'"
        v-if="title"
        v-bind="
          url ? { href: url, target: '_blank', rel: 'noopener noreferrer' } : {}
        "
        class="media-card-header__title"
        :class="titleClasses"
        >{{ title }}</component
      >
    </Tooltip>
    <div v-if="$slots.actions" class="media-card-header__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.media-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-2);
  padding: 0.5rem;
}

.media-card-header--flush {
  padding: 0;
}

.media-card-header__title {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.3;
  color: var(--color-fg-primary);
  text-decoration: none;
  /* Single-line ellipsis: long titles truncate to one row; the full title
     is available on hover via the tooltip. */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.media-card-header__title:hover {
  color: var(--color-accent-primary);
}

/* Hero titles: two-line clamp instead of the single-line ellipsis. */
.media-card-header__title--clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  white-space: normal;
  overflow: hidden;
}

.media-card-header__actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-1-5);
  flex-shrink: 0;
}
</style>
