import { beforeEach, describe, expect, it } from 'vitest';

import { usePlaybackAnchorRegistry } from './use-playback-anchor-registry';

function fakeEl(): HTMLElement {
  return document.createElement('div');
}

describe('usePlaybackAnchorRegistry', () => {
  beforeEach(() => {
    // Module-scope singleton: reset the registry and dock flags between tests.
    const registry = usePlaybackAnchorRegistry();
    registry.anchorCandidates.value = new Map();
    registry.playbackDockMode.value = 'auto';
    registry.forceShowPlayer.value = false;
  });

  it('registers an anchor candidate optimistically in-view', () => {
    const registry = usePlaybackAnchorRegistry();
    const candidate = registry.registerAnchorCandidate(
      'https://vid/1',
      fakeEl(),
      null,
    );

    expect(candidate.inView).toBe(true);
    expect(registry.anchorCandidates.value.get('https://vid/1')).toHaveLength(
      1,
    );
  });

  it('accumulates candidates per video url', () => {
    const registry = usePlaybackAnchorRegistry();
    registry.registerAnchorCandidate('https://vid/1', fakeEl(), null);
    registry.registerAnchorCandidate('https://vid/1', fakeEl(), null);

    expect(registry.anchorCandidates.value.get('https://vid/1')).toHaveLength(
      2,
    );
  });

  it('setAnchorCandidateInView flips the flag and replaces the map entry', () => {
    const registry = usePlaybackAnchorRegistry();
    const before = registry.anchorCandidates.value;
    const candidate = registry.registerAnchorCandidate(
      'https://vid/1',
      fakeEl(),
      null,
    );

    registry.setAnchorCandidateInView('https://vid/1', candidate, false);

    expect(candidate.inView).toBe(false);
    expect(registry.anchorCandidates.value).not.toBe(before); // new map instance

    const sameMap = registry.anchorCandidates.value;
    registry.setAnchorCandidateInView('https://vid/1', candidate, false);
    expect(registry.anchorCandidates.value).toBe(sameMap); // same value → no churn
  });

  it('unregisterAnchorCandidate removes the entry and prunes empty urls', () => {
    const registry = usePlaybackAnchorRegistry();
    const first = registry.registerAnchorCandidate(
      'https://vid/1',
      fakeEl(),
      null,
    );
    const second = registry.registerAnchorCandidate(
      'https://vid/1',
      fakeEl(),
      null,
    );

    registry.unregisterAnchorCandidate('https://vid/1', first);
    expect(registry.anchorCandidates.value.get('https://vid/1')).toEqual([
      second,
    ]);

    registry.unregisterAnchorCandidate('https://vid/1', second);
    expect(registry.anchorCandidates.value.has('https://vid/1')).toBe(false);
  });

  it('drives the dock-mode state machine', () => {
    const registry = usePlaybackAnchorRegistry();
    expect(registry.playbackDockMode.value).toBe('auto');

    registry.latchFloating();
    expect(registry.playbackDockMode.value).toBe('float-latched');

    registry.resetDockForLaunch();
    expect(registry.playbackDockMode.value).toBe('auto');

    registry.engagePlayback();
    expect(registry.playbackDockMode.value).toBe('auto');

    registry.dismissPlaybackWindow();
    expect(registry.playbackDockMode.value).toBe('dock-dismissed');

    registry.dockPlayback(true);
    expect(registry.playbackDockMode.value).toBe('auto');
    expect(registry.forceShowPlayer.value).toBe(false);

    registry.dockPlayback(false);
    expect(registry.playbackDockMode.value).toBe('dock-dismissed');
  });

  it('forceShowPlayer lifts on engage-independent paths and drops on dock', () => {
    const registry = usePlaybackAnchorRegistry();
    registry.forceShowPlayer.value = true;

    registry.dismissPlaybackWindow();
    expect(registry.forceShowPlayer.value).toBe(false);

    registry.forceShowPlayer.value = true;
    registry.resetDockForLaunch();
    expect(registry.forceShowPlayer.value).toBe(false);
    expect(registry.playbackDockMode.value).toBe('auto');
  });
});
