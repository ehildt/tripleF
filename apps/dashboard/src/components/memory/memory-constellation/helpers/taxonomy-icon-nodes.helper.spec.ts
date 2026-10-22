import { describe, expect, it } from 'vitest';

import { TAXONOMY_ICON_NODES } from './taxonomy-icon-nodes.helper';

describe('TAXONOMY_ICON_NODES', () => {
  it('is a curated name → Lucide node map', () => {
    expect(Object.keys(TAXONOMY_ICON_NODES).length).toBeGreaterThan(50);
    expect(TAXONOMY_ICON_NODES['activity']).toBeDefined();
    expect(TAXONOMY_ICON_NODES['gamepad-2']).toBeDefined();
    expect(TAXONOMY_ICON_NODES['brain']).toBeDefined();
  });
});
