import { ref } from 'vue';

/** Expand/collapse state for the full spec table behind the stat grid. */
export function useSpecsExpansion() {
  const showAllSpecs = ref(false);

  function toggleSpecs() {
    showAllSpecs.value = !showAllSpecs.value;
  }

  return { showAllSpecs, toggleSpecs };
}
