<script setup lang="ts">
const props = defineProps<{
  selected: boolean;
  disabled?: boolean;
  highlighted?: boolean;
}>();

const emit = defineEmits<{
  (e: 'click'): void;
}>();

function onClick() {
  if (!props.disabled) {
    emit('click');
  }
}
</script>

<template>
  <button
    type="button"
    class="pproc-toggle-button"
    :class="{
      'pproc-toggle-button--selected': selected && !disabled,
      'pproc-toggle-button--disabled': disabled,
      'pproc-toggle-button--highlighted': highlighted,
    }"
    @click="onClick"
  >
    <div v-if="selected && !disabled" class="pproc-toggle-button__glow" />

    <div class="pproc-toggle-button__body">
      <slot name="icon" />
      <div class="pproc-toggle-button__content">
        <slot name="content" />
      </div>
      <slot name="checkbox" />
    </div>
  </button>
</template>

<style scoped>
.pproc-toggle-button {
  position: relative;
  width: 100%;
  height: 100%;
  padding: var(--spacing-3);
  border: 1px solid var(--color-divider);
  background-color: var(--color-bg-primary);
  text-align: left;
  overflow: hidden;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    filter 0.2s ease,
    opacity 0.2s ease;
}

.pproc-toggle-button:hover:not(:disabled):not(.pproc-toggle-button--disabled) {
  border-color: color-mix(in srgb, var(--color-fg-muted) 50%, transparent);
  filter: brightness(1.05);
}

.pproc-toggle-button--selected {
  border-color: color-mix(
    in srgb,
    var(--color-tab-preprocessing) 20%,
    transparent
  );
  background-color: var(--color-bg-secondary);
}

.pproc-toggle-button--selected:hover:not(:disabled) {
  filter: brightness(1.1);
}

.pproc-toggle-button--disabled {
  background-color: color-mix(
    in srgb,
    var(--color-bg-primary) 50%,
    transparent
  );
  border-color: color-mix(in srgb, var(--color-divider) 50%, transparent);
  opacity: 0.6;
  cursor: default;
}

.pproc-toggle-button--highlighted {
  box-shadow: 0 0 0 2px
    color-mix(in srgb, var(--color-tab-preprocessing) 50%, transparent);
  filter: brightness(1.1);
  animation: pproc-toggle-pulse 2s ease-in-out infinite;
}

@keyframes pproc-toggle-pulse {
  0%,
  100% {
    filter: brightness(1.1);
  }
  50% {
    filter: brightness(1.2);
  }
}

.pproc-toggle-button__glow {
  position: absolute;
  inset: 0;
  opacity: 0.05;
  pointer-events: none;
  background: linear-gradient(
    90deg,
    var(--color-tab-preprocessing) 0%,
    transparent 70%
  );
}

.pproc-toggle-button__body {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.pproc-toggle-button__content {
  flex: 1;
  min-width: 0;
}
</style>
