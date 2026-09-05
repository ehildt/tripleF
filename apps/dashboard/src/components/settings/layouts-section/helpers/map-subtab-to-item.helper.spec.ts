import { describe, expect, it, vi } from 'vitest';

import { mapSubtabToItem } from './map-subtab-to-item.helper';

describe('mapSubtabToItem', () => {
  const t = vi.fn((key: string) => key);

  it('builds a non-stockmarket subtab item', () => {
    expect(
      mapSubtabToItem(
        { id: 'news', labelKey: 'common.news', icon: {} as never },
        true,
        t,
      ),
    ).toEqual({
      id: 'news',
      label: 'common.news',
      icon: {},
      muted: false,
      tooltip: undefined,
    });
  });

  it('mutes the stockmarket subtab when EODHD is disabled', () => {
    expect(
      mapSubtabToItem(
        {
          id: 'stockmarket',
          labelKey: 'common.stockmarket',
          icon: {} as never,
        },
        false,
        t,
      ),
    ).toMatchObject({
      muted: true,
      tooltip: 'common.stockmarketRequiresEodhd',
    });
  });
});
