<script setup lang="ts">
/**
 * Loading placeholder shown in the main column while the conversation list is
 * still booting or the active conversation's full content is being fetched.
 * Purely decorative (aria-hidden): it mirrors the shape of a user prompt plus
 * an assistant block, sized to the same scroll container as the real list so
 * the swap to content causes no layout shift.
 */
</script>

<template>
  <div class="exchange-skeleton" aria-hidden="true">
    <!-- User prompt row -->
    <div class="exchange-skeleton__row exchange-skeleton__row--user">
      <div class="exchange-skeleton__prompt" />
    </div>

    <!-- Assistant block -->
    <div class="exchange-skeleton__row exchange-skeleton__row--assistant">
      <div class="exchange-skeleton__assistant">
        <div class="exchange-skeleton__line exchange-skeleton__line--full" />
        <div class="exchange-skeleton__line exchange-skeleton__line--wide" />
        <div class="exchange-skeleton__line exchange-skeleton__line--narrow" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.exchange-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  height: calc(100vh - 12rem);
  padding: var(--spacing-4);
}

.exchange-skeleton__row {
  display: flex;
  flex-direction: column;
}

.exchange-skeleton__row--user {
  align-items: flex-end;
}

.exchange-skeleton__row--assistant {
  align-items: flex-start;
}

.exchange-skeleton__prompt {
  width: 55%;
  max-width: 26rem;
  height: 2.75rem;
  border-radius: var(--spacing-2);
  background-color: var(--color-bg-tertiary);
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.exchange-skeleton__assistant {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  width: 85%;
  max-width: 42rem;
  padding: var(--spacing-3);
  border-radius: var(--spacing-2);
  background-color: var(--color-bg-tertiary);
}

.exchange-skeleton__line {
  height: 0.75rem;
  border-radius: 0.25rem;
  background-color: color-mix(
    in srgb,
    var(--color-fg-muted) 18%,
    var(--color-bg-tertiary)
  );
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.exchange-skeleton__line--full {
  width: 100%;
}

.exchange-skeleton__line--wide {
  width: 78%;
}

.exchange-skeleton__line--narrow {
  width: 48%;
}
</style>
