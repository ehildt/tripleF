import { ref } from 'vue';

/**
 * Per-diagram view controls shared by the three memory spaces: label
 * visibility, idle auto-rotation, a reset signal that collapses expanded
 * clusters and refits the camera, and the expand/collapse-all cluster
 * toggle. Each space owns its own instance so the three canvases stay
 * independent.
 */
export function useConstellationControls() {
  const showLabels = ref(true);
  const rotationEnabled = ref(true);
  const resetSignal = ref(0);
  const isAllExpanded = ref(false);
  const toggleAllSignal = ref(0);

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
  function toggleAllClusters() {
    isAllExpanded.value = !isAllExpanded.value;
    toggleAllSignal.value += 1;
  }

  /** Mirror the canvas's user-expanded state into the expand-all toggle. */
  function setAllExpanded(value: boolean) {
    isAllExpanded.value = value;
  }

  return {
    showLabels,
    rotationEnabled,
    resetSignal,
    isAllExpanded,
    toggleAllSignal,
    toggleLabels,
    toggleRotation,
    resetView,
    toggleAllClusters,
    setAllExpanded,
  };
}
