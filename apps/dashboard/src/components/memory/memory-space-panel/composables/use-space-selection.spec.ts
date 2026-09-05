import { beforeEach, describe, expect, it } from 'vitest';
import { ref } from 'vue';

import type {
  ConstellationFriction,
  ConstellationNode,
} from '../../memory-constellation/MemoryConstellation.types';
import { useSpaceSelection } from './use-space-selection';

const NODE: ConstellationNode = {
  id: 'a',
  label: 'stellar blade',
  topicKey: 'stellar blade',
  text: 'Stellar Blade',
  keys: ['stellar blade'],
};

const NO_FRICTIONS = ref<ConstellationFriction[]>([]);

describe('useSpaceSelection', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with no selection and the metadata column visible', () => {
    const selection = useSpaceSelection('partition:default', NO_FRICTIONS);

    expect(selection.selectedNode.value).toBeNull();
    expect(selection.metadataCollapsed.value).toBe(false);
  });

  it('selects a node on click', () => {
    const selection = useSpaceSelection('partition:default', NO_FRICTIONS);

    selection.selectNode(NODE);
    expect(selection.selectedNode.value).toEqual(NODE);
  });

  it("derives the selected node's open frictions", () => {
    const frictions = ref<ConstellationFriction[]>([
      { source: 'a', target: 'b', reason: 'conflicting release year' },
      { source: 'c', target: 'd', reason: 'unrelated' },
    ]);
    const selection = useSpaceSelection('partition:default', frictions);

    expect(selection.selectedFrictions.value).toEqual([]);

    selection.selectNode(NODE);
    expect(selection.selectedFrictions.value).toEqual([
      { source: 'a', target: 'b', reason: 'conflicting release year' },
    ]);
  });

  it('toggles the metadata column and persists the state', () => {
    const selection = useSpaceSelection('partition:default', NO_FRICTIONS);

    selection.toggleMetadata();
    expect(selection.metadataCollapsed.value).toBe(true);
    expect(
      localStorage.getItem('memory-constellation:metadata:partition:default'),
    ).toBe('true');

    // A fresh instance reads the persisted collapsed state.
    const reloaded = useSpaceSelection('partition:default', NO_FRICTIONS);
    expect(reloaded.metadataCollapsed.value).toBe(true);
  });

  it('does not persist when no storage key is given', () => {
    const selection = useSpaceSelection(undefined, NO_FRICTIONS);

    selection.toggleMetadata();
    expect(selection.metadataCollapsed.value).toBe(true);
    expect(
      localStorage.getItem('memory-constellation:metadata:undefined'),
    ).toBeNull();
  });
});
