import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('usePlaybackSession', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    // Module-scope singleton: reload the module so each test gets a fresh one.
    vi.resetModules();
  });

  it('resolves the same session instance for every caller', async () => {
    const { usePlaybackSession } = await import('./use-playback-session');
    expect(usePlaybackSession()).toBe(usePlaybackSession());
  });

  it('creates the session lazily — nothing exists before the first call', async () => {
    // Reset twice: the second module instance is independent of the first,
    // which is exactly what an app relaunch (fresh module graph) means.
    const { usePlaybackSession: firstCall } =
      await import('./use-playback-session');
    const first = firstCall();
    vi.resetModules();
    setActivePinia(createPinia());
    const { usePlaybackSession: secondCall } =
      await import('./use-playback-session');
    expect(secondCall()).not.toBe(first);
  });
});
