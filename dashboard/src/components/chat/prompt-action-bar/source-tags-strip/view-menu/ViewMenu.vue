<script setup lang="ts">
import {
  ChevronFirst,
  ChevronLast,
  Form,
  GalleryVerticalEnd,
} from '@lucide/vue';

import type { CollapsibleSectionKey } from '@/types/harness-response-data.model';

import MotionIcon from '../../../../shared/ui/motion-icon/MotionIcon.vue';
import Tooltip from '../../../../shared/ui/tooltip/Tooltip.vue';
import type { ViewMenuProps } from './ViewMenu.types';

defineProps<ViewMenuProps>();

const emit = defineEmits<{
  toggle: [];
  toggleScrollMode: [];
  toggleSection: [key: CollapsibleSectionKey];
  togglePresentation: [media: 'image' | 'video'];
}>();
</script>

<template>
  <div class="view-menu">
    <Tooltip v-if="!alwaysShow" :text="toggleTitle">
      <button
        type="button"
        class="view-menu__toggle"
        :aria-label="toggleTitle"
        :aria-expanded="!collapsed"
        @click="emit('toggle')"
      >
        <ChevronFirst
          v-if="collapsed"
          class="view-menu__toggle-icon"
          aria-hidden="true"
        />
        <ChevronLast v-else class="view-menu__toggle-icon" aria-hidden="true" />
      </button>
    </Tooltip>
    <template v-if="alwaysShow || !collapsed">
      <Tooltip :text="scrollModeTitle">
        <button
          type="button"
          class="view-menu__tag"
          :aria-label="scrollModeTitle"
          :aria-pressed="scrollMode === 'carousel'"
          @click="emit('toggleScrollMode')"
        >
          <MotionIcon>
            <GalleryVerticalEnd
              v-if="scrollMode === 'carousel'"
              class="view-menu__tag-icon"
              aria-hidden="true"
            />
            <Form v-else class="view-menu__tag-icon" aria-hidden="true" />
          </MotionIcon>
        </button>
      </Tooltip>
      <Tooltip
        v-for="presentationToggle in presentationToggles"
        :key="presentationToggle.key"
        :text="presentationToggle.title"
      >
        <button
          type="button"
          class="view-menu__tag"
          :class="{
            'view-menu__tag--gallery':
              presentationToggle.presentation === 'gallery',
          }"
          :aria-label="presentationToggle.title"
          :aria-pressed="presentationToggle.presentation === 'gallery'"
          @click="emit('togglePresentation', presentationToggle.media)"
        >
          <MotionIcon>
            <component
              :is="presentationToggle.icon"
              class="view-menu__tag-icon"
              aria-hidden="true"
            />
          </MotionIcon>
        </button>
      </Tooltip>
      <Tooltip
        v-for="sectionToggle in sectionToggles"
        :key="sectionToggle.key"
        :text="sectionToggle.title"
      >
        <button
          type="button"
          class="view-menu__tag"
          :class="{ 'view-menu__tag--disabled': sectionToggle.hidden }"
          :aria-label="sectionToggle.title"
          :aria-pressed="!sectionToggle.hidden"
          @click="emit('toggleSection', sectionToggle.key)"
        >
          <MotionIcon>
            <component
              :is="sectionToggle.icon"
              class="view-menu__tag-icon"
              aria-hidden="true"
            />
          </MotionIcon>
        </button>
      </Tooltip>
    </template>
  </div>
</template>

<style scoped>
.view-menu {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.view-menu__toggle {
  display: inline-flex;
  align-items: center;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--color-status-info);
  transition: color 0.2s ease;
}

.view-menu__toggle:hover {
  color: color-mix(in srgb, var(--color-status-info) 60%, white);
}

.view-menu__toggle-icon {
  width: 0.8rem;
  height: 0.8rem;
}

/* View toggles (scroll mode, section hide/show) render in the blueish info
   hue so they read as a separate menu from the orange search sources. */
.view-menu__tag {
  display: inline-flex;
  align-items: center;
  padding: 0;
  border: none;
  background: none;
  color: var(--color-status-info);
  cursor: pointer;
  transition: color 0.2s ease;
}

.view-menu__tag:hover {
  color: color-mix(in srgb, var(--color-status-info) 60%, white);
}

/* A hidden section renders muted so its state reads at a glance, like the
   disabled search sources. */
.view-menu__tag--disabled {
  color: var(--color-fg-muted);
}

/* The gallery presentation uses the gallery status hue (theme-driven, not a
   fixed color); the list presentation stays in the blueish info hue, so the
   active presentation is visible at a glance. */
.view-menu__tag--gallery {
  color: var(--color-status-gallery);
}

.view-menu__tag--gallery:hover {
  color: color-mix(in srgb, var(--color-status-gallery) 60%, white);
}

.view-menu__tag-icon {
  width: 0.8rem;
  height: 0.8rem;
}
</style>
