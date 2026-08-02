import { tryOnScopeDispose } from '@vueuse/core';
import { ref } from 'vue';

export function useBlink(defaultDuration = 1000) {
  const isBlinking = ref(false);
  let timer: ReturnType<typeof setTimeout> | null = null;

  function stop() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    isBlinking.value = false;
  }

  function start() {
    stop();
    isBlinking.value = true;
  }

  function blink(duration = defaultDuration) {
    start();
    timer = setTimeout(() => {
      stop();
    }, duration);
  }

  tryOnScopeDispose(stop);

  return {
    isBlinking,
    blink,
    start,
    stop,
  };
}
