<script setup lang="ts">
interface Props {
  tabColor: string;
  blinkLogo: boolean;
}

defineProps<Props>();
</script>

<template>
  <div class="app-brand">
    <div class="app-brand__logo" :style="{ borderColor: tabColor }">
      <span
        class="app-brand__mark"
        :class="blinkLogo ? 'animate-blink-3' : 'animate-blink-stop'"
        :style="{ color: tabColor }"
      >
        H
      </span>
    </div>

    <div class="app-brand__titles">
      <h1 class="app-brand__title">
        <span :style="{ color: tabColor }">ckir.io</span>
        <span class="text-fg-muted">/</span>
        <span :style="{ color: tabColor }">harness</span>
        <span class="app-brand__cursor" :style="{ color: tabColor }">_</span>
      </h1>
      <p class="app-brand__subtitle">AI Harness Console</p>
    </div>
  </div>
</template>

<style scoped>
.app-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.app-brand__logo {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  border: 2px solid;
  transition:
    border-color 0.3s ease,
    color 0.3s ease;
}

.app-brand__mark {
  font-family: var(--font-mono);
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1;
  transition: color 0.3s ease;
}

.app-brand__titles {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.app-brand__title {
  font-family: var(--font-mono);
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  line-height: 1.2;
}

.app-brand__cursor {
  transition: color 0.3s ease;
}

.app-brand__subtitle {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  line-height: 1;
  color: var(--color-fg-muted);
}
</style>
