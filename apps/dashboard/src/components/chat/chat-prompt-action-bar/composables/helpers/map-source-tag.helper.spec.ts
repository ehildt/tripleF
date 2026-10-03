import { Globe, Search } from '@lucide/vue';
import { describe, expect, it } from 'vitest';

import { mapSourceTag } from './map-source-tag.helper';

const sourceMeta = {
  web: { icon: Globe, label: 'web' },
};

describe('mapSourceTag', () => {
  it('resolves icon, label, and enabled title key for a known source', () => {
    expect(mapSourceTag({ key: 'web', enabled: true }, sourceMeta)).toEqual({
      key: 'web',
      enabled: true,
      icon: Globe,
      label: 'web',
      titleKey: 'common.sourceEnabled',
    });
  });

  it('uses the disabled title key when the source is off', () => {
    expect(mapSourceTag({ key: 'web', enabled: false }, sourceMeta)).toEqual({
      key: 'web',
      enabled: false,
      icon: Globe,
      label: 'web',
      titleKey: 'common.sourceDisabled',
    });
  });

  it('falls back to Search and the raw key for an unknown source', () => {
    expect(mapSourceTag({ key: 'mystery', enabled: true }, sourceMeta)).toEqual(
      {
        key: 'mystery',
        enabled: true,
        icon: Search,
        label: 'mystery',
        titleKey: 'common.sourceEnabled',
      },
    );
  });
});
