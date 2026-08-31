import { ref } from 'vue';

/**
 * Per-diagram view controls shared by the three memory spaces: label
 * visibility, idle auto-rotation, a reset signal that collapses expanded
 * topics and refits the camera, and the expand/collapse-all topic
 * toggle. Each space owns its own instance so the three canvases stay
 * independent.
 */
export function useConstellationControls() {
  const showLabels = ref(true);
  const rotationEnabled = ref(true);
  const resetSignal = ref(0);
  const isAllExpanded = ref(false);
  const toggleAllSignal = ref(0);
  /** Strict view: only curated + linked + reflected points (recommended = default). */
  const strictMode = ref(false);
  /** Weak (suggested/topical) edges on — the electricity arcs (default on). */
  const showSuggested = ref(true);

  function toggleLabels() {
    showLabels.value = !showLabels.value;
  }

  function toggleRotation() {
    rotationEnabled.value = !rotationEnabled.value;
  }

  function resetView() {
    resetSignal.value += 1;
  }

  /** Flip the expand-all state and signal the canvas to apply it. */
  function toggleAllTopics() {
    isAllExpanded.value = !isAllExpanded.value;
    toggleAllSignal.value += 1;
  }

  /** Mirror the canvas's user-expanded state into the expand-all toggle. */
  function setAllExpanded(value: boolean) {
    isAllExpanded.value = value;
  }

  /** Flip between the recommended (default) and strict view modes. */
  function toggleStrictMode() {
    strictMode.value = !strictMode.value;
  }

  /** Show/hide the weak (suggested/topical) edges — the electricity arcs. */
  function toggleSuggested() {
    showSuggested.value = !showSuggested.value;
  }

  return {
    showLabels,
    rotationEnabled,
    resetSignal,
    isAllExpanded,
    toggleAllSignal,
    strictMode,
    showSuggested,
    toggleLabels,
    toggleRotation,
    resetView,
    toggleAllTopics,
    setAllExpanded,
    toggleStrictMode,
    toggleSuggested,
  };
}
