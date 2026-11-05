import { describe, expect, it } from 'vitest';

import { derivePayloadChars } from './derive-payload-chars.helper.js';

describe('derivePayloadChars', () => {
  it('is uncapped when the ratio is zero or negative', () => {
    expect(derivePayloadChars(8192, 0, 10_000)).toBeUndefined();
    expect(derivePayloadChars(8192, -1, 10_000)).toBeUndefined();
  });

  it('derives the cap from the context window (4 chars per token)', () => {
    expect(derivePayloadChars(8192, 0.5, 10_000)).toBe(16_384);
  });

  it('truncates a fractional derived cap', () => {
    expect(derivePayloadChars(1000, 0.333, 0)).toBe(1332);
  });

  it('falls back to the absolute cap when the context window is unknown', () => {
    expect(derivePayloadChars(undefined, 0.5, 10_000)).toBe(10_000);
    expect(derivePayloadChars(0, 0.5, 10_000)).toBe(10_000);
  });

  it('is uncapped when neither the window nor a fallback exists', () => {
    expect(derivePayloadChars(undefined, 0.5, 0)).toBeUndefined();
  });
});
