import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import { requireModel } from './require-model.helper';

const mockToast = {
  error: vi.fn(),
};

describe('requireModel', () => {
  it('returns true when model is non-empty', () => {
    const model = ref('llama3.2-vision');
    expect(requireModel(model, mockToast)).toBe(true);
    expect(mockToast.error).not.toHaveBeenCalled();
  });

  it('returns false and shows error when model is empty', () => {
    const model = ref('  ');
    expect(requireModel(model, mockToast)).toBe(false);
    expect(mockToast.error).toHaveBeenCalledWith(
      'Model is required (e.g., llama3.2-vision, ministral-3:14b)',
    );
  });
});
