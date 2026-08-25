import { describe, expect, it } from 'vitest';

import { useConstellationControls } from './use-constellation-controls';

describe('useConstellationControls', () => {
  it('starts with labels and rotation on, clusters collapsed', () => {
    const controls = useConstellationControls();

    expect(controls.showLabels.value).toBe(true);
    expect(controls.rotationEnabled.value).toBe(true);
    expect(controls.resetSignal.value).toBe(0);
    expect(controls.isAllExpanded.value).toBe(false);
    expect(controls.toggleAllSignal.value).toBe(0);
  });

  it('toggles labels', () => {
    const controls = useConstellationControls();

    controls.toggleLabels();
    expect(controls.showLabels.value).toBe(false);
    controls.toggleLabels();
    expect(controls.showLabels.value).toBe(true);
  });

  it('toggles rotation', () => {
    const controls = useConstellationControls();

    controls.toggleRotation();
    expect(controls.rotationEnabled.value).toBe(false);
    controls.toggleRotation();
    expect(controls.rotationEnabled.value).toBe(true);
  });

  it('increments the reset signal', () => {
    const controls = useConstellationControls();

    controls.resetView();
    controls.resetView();
    expect(controls.resetSignal.value).toBe(2);
  });

  it('flips the expand-all state and signals on every toggle', () => {
    const controls = useConstellationControls();

    controls.toggleAllClusters();
    expect(controls.isAllExpanded.value).toBe(true);
    expect(controls.toggleAllSignal.value).toBe(1);
    controls.toggleAllClusters();
    expect(controls.isAllExpanded.value).toBe(false);
    expect(controls.toggleAllSignal.value).toBe(2);
  });

  it('mirrors the canvas-reported expanded state', () => {
    const controls = useConstellationControls();

    controls.setAllExpanded(false);
    expect(controls.isAllExpanded.value).toBe(false);
    controls.setAllExpanded(true);
    expect(controls.isAllExpanded.value).toBe(true);
  });
});
