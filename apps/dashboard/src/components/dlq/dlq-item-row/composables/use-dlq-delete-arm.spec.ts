import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useDlqDeleteArm } from './use-dlq-delete-arm';

// The composable registers onUnmounted — mount it in a host component so the
// lifecycle hook has an instance to attach to.
function mountDeleteArm() {
  let api!: ReturnType<typeof useDlqDeleteArm>;
  mount({
    setup() {
      api = useDlqDeleteArm();
      return () => null;
    },
  });
  return api;
}

describe('useDlqDeleteArm', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts unarmed', () => {
    const { isDeleteArmed } = mountDeleteArm();
    expect(isDeleteArmed.value).toBe(false);
  });

  it('arms on the first call without confirming', () => {
    const { isDeleteArmed, armOrConfirmDelete } = mountDeleteArm();
    expect(armOrConfirmDelete()).toBe(false);
    expect(isDeleteArmed.value).toBe(true);
  });

  it('confirms on the second call within the window and disarms', () => {
    const { isDeleteArmed, armOrConfirmDelete } = mountDeleteArm();
    armOrConfirmDelete();
    expect(armOrConfirmDelete()).toBe(true);
    expect(isDeleteArmed.value).toBe(false);
  });

  it('disarms automatically once the window expires', () => {
    const { isDeleteArmed, armOrConfirmDelete } = mountDeleteArm();
    armOrConfirmDelete();
    vi.advanceTimersByTime(3000);
    expect(isDeleteArmed.value).toBe(false);
    expect(armOrConfirmDelete()).toBe(false);
  });
});
