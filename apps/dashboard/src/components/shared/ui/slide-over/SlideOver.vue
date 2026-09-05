<script setup lang="ts">
/**
 * Right-anchored slide-over drawer, teleported to <body> so it stacks above
 * the page grid regardless of where the consumer lives. Pure chrome — the
 * caller owns the open state and supplies the body content via the slot.
 *
 * Accessibility contract (WAI-ARIA dialog pattern): `role="dialog"` +
 * `aria-modal`, focus moves into the panel on open, Tab/Shift+Tab cycle
 * inside it, Escape and backdrop clicks close it, and focus returns to the
 * invoking element on close. The page behind it is scroll-locked while open.
 *
 * Emits `close` for every close intent (Escape, backdrop, header button);
 * the parent decides when to actually close. `closed` fires after the leave
 * transition so the caller can drop the body content once the panel is gone.
 */
import { X } from '@lucide/vue';
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue';

import IconButton from '../icon-button/IconButton.vue';
import type { SlideOverProps } from './SlideOver.types';

const props = withDefaults(defineProps<SlideOverProps>(), {
  closeTitle: 'Close',
});

const emit = defineEmits<{
  /** Close intent: Escape, backdrop click, or the header close button. */
  close: [];
  /** Leave transition finished — safe to unmount the body content. */
  closed: [];
}>();

const titleId = useId();
const panel = ref<HTMLElement | null>(null);

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

function cycleFocus(event: KeyboardEvent) {
  const focusables = Array.from(
    panel.value?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [],
  ).filter((element) => element.offsetParent !== null);
  if (!focusables.length) {
    event.preventDefault();
    return;
  }
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  const active = document.activeElement;
  if (event.shiftKey && (active === first || !panel.value?.contains(active))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.stopPropagation();
    emit('close');
    return;
  }
  if (event.key === 'Tab') cycleFocus(event);
}

/** The element that opened the drawer; focus returns here on close. */
let invokingElement: HTMLElement | null = null;
let previousBodyOverflow = '';

watch(
  () => props.open,
  async (open) => {
    if (open) {
      invokingElement =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      await nextTick();
      panel.value?.focus();
    } else {
      document.body.style.overflow = previousBodyOverflow;
      if (invokingElement && document.contains(invokingElement)) {
        invokingElement.focus();
      }
      invokingElement = null;
    }
  },
);

onBeforeUnmount(() => {
  if (props.open) document.body.style.overflow = previousBodyOverflow;
});
</script>

<template>
  <Teleport to="body">
    <Transition name="slide-over" @after-leave="emit('closed')">
      <div v-if="open" class="slide-over" @keydown="onKeydown">
        <div class="slide-over__backdrop" @click="emit('close')" />
        <aside
          ref="panel"
          class="slide-over__panel"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          tabindex="-1"
        >
          <header class="slide-over__header">
            <h2 :id="titleId" class="slide-over__title">{{ title }}</h2>
            <IconButton :title="closeTitle" size="sm" @click="emit('close')">
              <X class="slide-over__close-icon" />
            </IconButton>
          </header>
          <div class="slide-over__body">
            <slot />
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.slide-over {
  position: fixed;
  inset: 0;
  /* Above the floating widgets (1250), below the toasts (9999). */
  z-index: 1300;
}

.slide-over__backdrop {
  position: absolute;
  inset: 0;
  background-color: color-mix(
    in srgb,
    var(--color-bg-primary) 70%,
    transparent
  );
}

.slide-over__panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(40rem, 100vw);
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg-elevated);
  border-left: 1px solid var(--color-divider);
  outline: none;
}

.slide-over__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-4);
  border-bottom: 1px solid var(--color-divider);
}

.slide-over__title {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-accent-primary);
}

.slide-over__close-icon {
  width: 1rem;
  height: 1rem;
}

.slide-over__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--spacing-3);
}

.slide-over-enter-active .slide-over__backdrop,
.slide-over-leave-active .slide-over__backdrop {
  transition: opacity 0.2s ease;
}

.slide-over-enter-from .slide-over__backdrop,
.slide-over-leave-to .slide-over__backdrop {
  opacity: 0;
}

.slide-over-enter-active .slide-over__panel,
.slide-over-leave-active .slide-over__panel {
  transition: transform 0.25s ease;
}

.slide-over-enter-from .slide-over__panel,
.slide-over-leave-to .slide-over__panel {
  transform: translateX(100%);
}
</style>
