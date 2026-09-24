<script setup lang="ts">
import { ref, watch } from 'vue';

import { useConstellationAnimation } from './composables/use-constellation-animation';

const canvasRef = ref<HTMLCanvasElement | null>(null);
const { start, stop } = useConstellationAnimation(canvasRef);

watch(
  () => canvasRef.value,
  (canvas) => {
    if (canvas) {
      stop();
      start();
    }
  },
  { immediate: true },
);
</script>

<template>
  <canvas
    ref="canvasRef"
    class="exchange-empty-state-canvas"
    aria-hidden="true"
  />
</template>

<style scoped>
.exchange-empty-state-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  animation: constellation-fade-in 900ms ease-out forwards;
}

@keyframes constellation-fade-in {
  to {
    opacity: 0.55;
  }
}
</style>
