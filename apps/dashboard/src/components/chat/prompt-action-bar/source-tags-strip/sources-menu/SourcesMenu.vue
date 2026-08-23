<script setup lang="ts">
import { ChevronFirst, ChevronLast, Landmark } from '@lucide/vue';

import Tooltip from '../../../../shared/ui/tooltip/Tooltip.vue';
import type { SourcesMenuProps } from './SourcesMenu.types';

defineProps<SourcesMenuProps>();

const emit = defineEmits<{
  toggle: [];
  toggleSource: [key: string];
  toggleEodhd: [];
}>();
</script>

<template>
  <div class="sources-menu">
    <Tooltip v-if="!alwaysShow" :text="toggleTitle">
      <button
        type="button"
        class="sources-menu__toggle"
        :aria-label="toggleTitle"
        :aria-expanded="!collapsed"
        @click="emit('toggle')"
      >
        <ChevronFirst
          v-if="collapsed"
          class="sources-menu__toggle-icon"
          aria-hidden="true"
        />
        <ChevronLast
          v-else
          class="sources-menu__toggle-icon"
          aria-hidden="true"
        />
      </button>
    </Tooltip>
    <template v-if="alwaysShow || !collapsed">
      <Tooltip v-for="tag in sourceTags" :key="tag.key" :text="tag.title">
        <button
          type="button"
          class="sources-menu__tag"
          :class="{ 'sources-menu__tag--disabled': !tag.enabled }"
          :aria-label="tag.title"
          :aria-pressed="tag.enabled"
          @click="emit('toggleSource', tag.key)"
        >
          <component
            :is="tag.icon"
            class="sources-menu__tag-icon"
            aria-hidden="true"
          />
        </button>
      </Tooltip>
      <Tooltip v-if="eodhdState?.available" :text="eodhdToggleTitle">
        <button
          type="button"
          class="sources-menu__tag"
          :class="{ 'sources-menu__tag--disabled': !eodhdState.enabled }"
          :aria-label="eodhdToggleTitle"
          :aria-pressed="eodhdState.enabled"
          @click="emit('toggleEodhd')"
        >
          <Landmark class="sources-menu__tag-icon" aria-hidden="true" />
        </button>
      </Tooltip>
    </template>
  </div>
</template>

<style scoped>
.sources-menu {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.sources-menu__toggle {
  display: inline-flex;
  align-items: center;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--color-accent-primary);
  transition: color 0.2s ease;
}

.sources-menu__toggle:hover {
  color: var(--color-accent-secondary);
}

.sources-menu__toggle-icon {
  width: 0.8rem;
  height: 0.8rem;
}

.sources-menu__tag {
  display: inline-flex;
  align-items: center;
  padding: 0;
  border: none;
  background: none;
  color: var(--color-accent-primary);
  cursor: pointer;
  transition: color 0.2s ease;
}

.sources-menu__tag--disabled {
  color: var(--color-fg-muted);
}

.sources-menu__tag:hover {
  color: var(--color-accent-secondary);
}

.sources-menu__tag-icon {
  width: 0.8rem;
  height: 0.8rem;
}
</style>
