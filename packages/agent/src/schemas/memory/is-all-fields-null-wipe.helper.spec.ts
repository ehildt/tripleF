import { describe, expect, it } from 'vitest';

import { isAllFieldsNullWipe } from './is-all-fields-null-wipe.helper.js';
import type { MemoryCognitionProfile } from './memory-cognition.model.js';

describe('isAllFieldsNullWipe', () => {
  it('is false without a stored document', () => {
    expect(isAllFieldsNullWipe(undefined, { name: null })).toBe(false);
  });

  it('is false when the stored document is empty', () => {
    expect(isAllFieldsNullWipe({}, { name: null })).toBe(false);
  });

  it('is false when the patch has no fields', () => {
    expect(isAllFieldsNullWipe({ name: 'Sam' }, {})).toBe(false);
  });

  it('detects a patch that nulls every stored top-level field', () => {
    const current: MemoryCognitionProfile = { name: 'Sam', likes: ['jazz'] };
    expect(isAllFieldsNullWipe(current, { name: null, likes: undefined })).toBe(true);
  });

  it('is false when the patch replaces any value', () => {
    const current: MemoryCognitionProfile = { name: 'Sam', likes: ['jazz'] };
    expect(isAllFieldsNullWipe(current, { name: null, likes: ['rock'] })).toBe(false);
  });

  it('is false when deletions do not cover every stored field', () => {
    const current: MemoryCognitionProfile = { name: 'Sam', likes: ['jazz'] };
    expect(isAllFieldsNullWipe(current, { name: null })).toBe(false);
  });
});
