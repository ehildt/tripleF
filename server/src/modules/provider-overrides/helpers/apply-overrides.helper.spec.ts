import { describe, expect, it } from 'vitest';

import type { ProviderOverridesSnapshot } from '../services/provider-overrides.service.js';

import { applyOverrides } from './apply-overrides.helper.js';

const snapshot = (): ProviderOverridesSnapshot =>
  ({
    serper: { apiKey: 'serper-key' },
    brightData: { apiKey: 'bd-key' },
    sources: { preferred: ['serper'], blocked: [] },
    layouts: { classic: true, editorial: true, split: true, mosaic: true },
    youtube: { apiKey: 'yt-key' },
    eodhd: { apiKey: 'eodhd-key' },
  }) as ProviderOverridesSnapshot;

describe('applyOverrides', () => {
  it('returns a copy of the snapshot when there are no overrides', () => {
    const result = applyOverrides(snapshot(), {});
    expect(result).toEqual(snapshot());
    expect(result).not.toBe(snapshot());
  });

  it('merges live overrides on top of the snapshot', () => {
    const result = applyOverrides(snapshot(), {
      serper: { apiKey: 'new-key' },
    });
    expect(result.serper.apiKey).toBe('new-key');
    expect(result.brightData.apiKey).toBe('bd-key');
  });

  it('ignores unknown providers', () => {
    const result = applyOverrides(snapshot(), {
      unknown: { apiKey: 'x' },
    } as never);
    expect(result).toEqual(snapshot());
  });

  it('does not mutate the original snapshot', () => {
    const original = snapshot();
    applyOverrides(original, { serper: { apiKey: 'new-key' } });
    expect(original.serper.apiKey).toBe('serper-key');
  });
});
