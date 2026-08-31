import { describe, expect, it, vi } from 'vitest';

import { mapSectionToggle } from './map-section-toggle.helper';

describe('mapSectionToggle', () => {
  const t = vi.fn((key: string, params?: Record<string, unknown>) =>
    params ? `${key}:${params.section}` : key,
  );

  it('builds a hidden section toggle', () => {
    expect(
      mapSectionToggle(
        { key: 'sources', icon: {} as never, labelKey: 'common.sources' },
        { sources: true },
        t,
      ),
    ).toEqual({
      key: 'sources',
      icon: {},
      hidden: true,
      title: 'common.showSectionWithName:common.sources',
    });
  });
});
