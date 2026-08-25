import { beforeEach, describe, expect, it } from 'vitest';

import type { ConstellationNode } from '../../memory-constellation/MemoryConstellation.types';
import { useSpaceSelection } from './use-space-selection';

const NODE: ConstellationNode = {
  id: 'a',
  label: 'stellar blade',
  clusterKey: 'stellar blade',
  text: 'Stellar Blade',
  keys: ['stellar blade'],
};

describe('useSpaceSelection', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with no selection and the metadata column visible', () => {
    const selection = useSpaceSelection('partition:default');

    expect(selection.selectedNode.value).toBeNull();
    expect(selection.metadataCollapsed.value).toBe(false);
  });

  it('selects a node on click', () => {
    const selection = useSpaceSelection('partition:default');

    selection.selectNode(NODE);
    expect(selection.selectedNode.value).toEqual(NODE);
  });

  it('toggles the metadata column and persists the state', () => {
    const selection = useSpaceSelection('partition:default');

    selection.toggleMetadata();
    expect(selection.metadataCollapsed.value).toBe(true);
    expect(
      localStorage.getItem('memory-constellation:metadata:partition:default'),
    ).toBe('true');

    // A fresh instance reads the persisted collapsed state.
    const reloaded = useSpaceSelection('partition:default');
    expect(reloaded.metadataCollapsed.value).toBe(true);
  });

  it('does not persist when no storage key is given', () => {
    const selection = useSpaceSelection(undefined);

    selection.toggleMetadata();
    expect(selection.metadataCollapsed.value).toBe(true);
    expect(
      localStorage.getItem('memory-constellation:metadata:undefined'),
    ).toBeNull();
  });
});
