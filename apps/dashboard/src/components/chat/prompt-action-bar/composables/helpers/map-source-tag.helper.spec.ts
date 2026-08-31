import { describe, expect, it, vi } from 'vitest';

import { mapSourceTag } from './map-source-tag.helper';

describe('mapSourceTag', () => {
  const t = vi.fn((key: string, params?: Record<string, unknown>) =>
    params ? `${key}:${params.label}` : key,
  );

  it('builds an enabled source tag', () => {
    const result = mapSourceTag(
      { key: 'web', enabled: true },
      { web: { icon: {} as never, label: 'web' } },
      t,
    );
    expect(result).toMatchObject({ key: 'web', enabled: true, label: 'web' });
    expect(result.title).toBe('common.sourceEnabled:web');
  });

  it('falls back to the key for unknown sources', () => {
    const result = mapSourceTag({ key: 'unknown', enabled: false }, {}, t);
    expect(result.label).toBe('unknown');
    expect(result.icon).toBeTruthy();
  });
});
