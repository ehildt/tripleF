import { beforeEach, describe, expect, it } from 'vitest';

import { useParameterHighlight } from './use-parameter-highlight';

describe('useParameterHighlight', () => {
  beforeEach(() => {
    // Module-scope singleton: reset the shared hover between tests.
    const highlight = useParameterHighlight();
    highlight.hoveredVariant.value = null;
    highlight.hoveredParameter.value = null;
  });

  it('highlights nothing when no hover is set', () => {
    const highlight = useParameterHighlight();
    expect(highlight.highlightedParameters.value).toEqual([]);
    expect(highlight.highlightedVariants.value).toEqual([]);
  });

  it('hovered variant highlights the parameters it drives', () => {
    const highlight = useParameterHighlight();
    highlight.hoveredVariant.value = 'denoised';
    expect(highlight.highlightedParameters.value.includes('blurSigma')).toBe(
      true,
    );
    expect(highlight.highlightedParameters.value.includes('claheWidth')).toBe(
      false,
    );
  });

  it('hovered parameter highlights the variants that read it', () => {
    const highlight = useParameterHighlight();
    highlight.hoveredParameter.value = 'blurSigma';
    expect(highlight.highlightedVariants.value.includes('denoised')).toBe(true);
    expect(highlight.highlightedVariants.value.includes('sharpened')).toBe(
      false,
    );
  });
});
