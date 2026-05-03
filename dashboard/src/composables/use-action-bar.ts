import { ref } from 'vue';

export function useActionBar() {
  const actionBarRef = ref<HTMLElement | null>(null);

  return {
    actionBarRef,
  };
}
