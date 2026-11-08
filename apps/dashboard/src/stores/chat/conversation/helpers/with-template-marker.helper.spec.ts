import { describe, expect, it } from 'vitest';

import { withTemplateMarker } from './with-template-marker.helper';

describe('withTemplateMarker', () => {
  it('prefixes structured templates with their marker', () => {
    expect(withTemplateMarker('Title: X', 'product')).toBe(
      '[Template: product]\nTitle: X',
    );
  });

  it('returns the answer unchanged for the free-form text template', () => {
    expect(withTemplateMarker('plain answer', 'text')).toBe('plain answer');
  });

  it('returns the answer unchanged without a template', () => {
    expect(withTemplateMarker('plain answer')).toBe('plain answer');
    expect(withTemplateMarker('plain answer', undefined)).toBe('plain answer');
  });

  it('keeps empty answers empty', () => {
    expect(withTemplateMarker('', 'product')).toBe('');
  });
});
