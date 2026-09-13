<script setup lang="ts">
import { MessagesSquare } from '@lucide/vue';
import { computed, ref } from 'vue';

import { useMenuPosition } from '@/composables/use-menu-position';

import IconButton from '../../../../shared/ui/icon-button/IconButton.vue';
import type { ConversationMenuTriggerProps } from './ConversationMenuTrigger.types';

const props = defineProps<ConversationMenuTriggerProps>();

const emit = defineEmits<{
  toggleMenu: [];
}>();

// Teleport the dropdown to <body> with a fixed position — rendered inline it
// sits inside the sticky toolbar's stacking context, so the chat column and
// video popouts cover it.
const triggerRef = ref<HTMLElement | null>(null);
const { positionStyle } = useMenuPosition(
  triggerRef,
  computed(() => props.isOpen),
);

/** Hover hints (brain blink on the model selector) only make sense while the
 *  menu is disabled — an enabled menu needs no "select a model first" cue. */
function onIconMouseEnter() {
  if (props.isDisabled) props.onMouseEnter?.();
}

function onIconMouseLeave() {
  if (props.isDisabled) props.onMouseLeave?.();
}
</script>

<template>
  <div ref="triggerRef" class="conversation-menu-trigger">
    <IconButton
      :active="isOpen"
      :disabled="isDisabled"
      :blinking="blinking?.value"
      :title="$t('common.newChatTooltip')"
      @mouseenter="onIconMouseEnter"
      @mouseleave="onIconMouseLeave"
      @click.stop="emit('toggleMenu')"
    >
      <MessagesSquare />
    </IconButton>
    <Teleport to="body">
      <div
        v-if="isOpen"
        class="conversation-menu-trigger__dropdown"
        data-toolbar-menu-dropdown
        :style="positionStyle ?? undefined"
        @click.stop
      >
        <slot />
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.conversation-menu-trigger {
  position: relative;
  flex-shrink: 0;
}

.conversation-menu-trigger__dropdown {
  /* Teleported to <body>: above the chat column (z-60) and the floating
     video popouts (z-1000), below the lightbox (1100) — same layer as the
     model-select menu. Position comes from the trigger anchor inline style. */
  position: fixed;
  z-index: 1050;
  margin-left: var(--spacing-1);
  width: 14rem;
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-divider);
  box-shadow: 0 10px 15px -3px
    color-mix(in srgb, var(--color-bg-primary) 10%, transparent);
}
</style>
