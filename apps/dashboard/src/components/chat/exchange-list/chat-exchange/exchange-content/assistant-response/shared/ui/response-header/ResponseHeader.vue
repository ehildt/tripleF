<script setup lang="ts">
/**
 * Title + optional subtitle header block shared by every response surface:
 * hero panels (news/article/evaluation/summary/…), stockmarket quote
 * headers, product/shop banners, and the evaluation subject profile. The
 * trailing default slot carries right-aligned content (e.g. a score).
 * `panel` gives the padded tertiary backdrop of the hero; `ruled` the
 * divider of the subject profile; `size` the scale.
 */
import { computed } from 'vue';

import type { ResponseHeaderProps } from './ResponseHeader.types';

const props = withDefaults(defineProps<ResponseHeaderProps>(), {
  title: undefined,
  subtitle: undefined,
  size: 'md',
  as: 'h2',
  panel: false,
  ruled: false,
});

const headingTag = computed(() => `h${props.as === 'h3' ? 3 : 2}`);
</script>

<template>
  <div
    class="response-header"
    :class="{
      'response-header--panel': panel,
      'response-header--ruled': ruled,
    }"
  >
    <div class="response-header__title-block">
      <component
        :is="headingTag"
        class="response-header__title"
        :class="`response-header__title--${size}`"
        >{{ title }}</component
      >
      <p v-if="subtitle" class="response-header__subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.default" class="response-header__trailing">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.response-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1em;
  min-width: 0;
}

/* Hero panels: a stacked title block on the padded tertiary backdrop. */
.response-header--panel {
  flex-direction: column;
  gap: var(--spacing-1);
  background-color: var(--color-bg-tertiary);
  padding: 1rem 0.5rem;
}

/* Subject-profile headers: hairline under the row. */
.response-header--ruled {
  padding-bottom: 0.25em;
  border-bottom: 1px solid var(--color-divider);
}

.response-header__title-block {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  min-width: 0;
}

.response-header__title {
  margin: 0;
  color: var(--color-fg-primary);
}

.response-header__title--sm {
  font-size: 1.1em;
}

.response-header__title--md {
  font-size: 1.25rem;
}

.response-header__title--xl {
  font-size: 2rem;
  line-height: 1.15;
}

.response-header__subtitle {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 500;
  line-height: 1.4;
  color: var(--color-fg-muted);
}

.response-header__trailing {
  flex-shrink: 0;
}
</style>
