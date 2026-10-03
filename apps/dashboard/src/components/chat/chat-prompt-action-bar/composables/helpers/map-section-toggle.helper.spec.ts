import { Link } from '@lucide/vue';
import { describe, expect, it } from 'vitest';

import type { CollapsedSections } from '@/types/harness-response-data.model';

import { mapSectionToggle } from './map-section-toggle.helper';

const config = { key: 'sources', icon: Link } as const;

const allVisible: CollapsedSections = {
  sources: false,
  keyFindings: false,
  internationalCoverage: false,
};

const sourcesHidden: CollapsedSections = {
  sources: true,
  keyFindings: false,
  internationalCoverage: false,
};

describe('mapSectionToggle', () => {
  it('returns a show title key when the section is hidden', () => {
    expect(mapSectionToggle(config, sourcesHidden)).toEqual({
      key: 'sources',
      icon: Link,
      hidden: true,
      titleKey: 'common.showSectionWithName',
    });
  });

  it('returns a hide title key when the section is visible', () => {
    expect(mapSectionToggle(config, allVisible)).toEqual({
      key: 'sources',
      icon: Link,
      hidden: false,
      titleKey: 'common.hideSectionWithName',
    });
  });
});
