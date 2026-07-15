<script setup lang="ts">
/**
 * The role-colored gradient line above an exchange body: accent-tinted for
 * user (right-to-left) and assistant (left-to-right), red for errors.
 */
defineProps<{
  variant: 'user' | 'error' | 'assistant';
}>();
</script>

<template>
  <div class="exchange-divider" :class="`exchange-divider--${variant}`" />
</template>

<style scoped>
.exchange-divider {
  height: 1px;
  width: 100%;
  flex-shrink: 0;
}

.exchange-divider--user {
  background: linear-gradient(
    to left,
    color-mix(in srgb, var(--color-tab-rest) 40%, transparent),
    transparent
  );
}

.exchange-divider--error {
  background: linear-gradient(
    to right,
    color-mix(in srgb, var(--color-status-error) 50%, transparent),
    transparent
  );
}

.exchange-divider--assistant {
  background: linear-gradient(
    to right,
    color-mix(in srgb, var(--color-tab-rest) 40%, transparent),
    transparent
  );
}
</style>
