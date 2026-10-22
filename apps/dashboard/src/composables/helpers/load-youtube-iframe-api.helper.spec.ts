import { describe, expect, it, vi } from 'vitest';

import { loadYouTubeIframeApi } from './load-youtube-iframe-api.helper';

// The module caches one shared promise: simulate module state by tracking
// the `YT` global and the injected script directly.
describe('loadYouTubeIframeApi', () => {
  it('resolves immediately when YT is already present', async () => {
    const fakePlayer = class {};
    (window as { YT?: unknown }).YT = { Player: fakePlayer };

    await expect(loadYouTubeIframeApi()).resolves.toBeUndefined();

    delete (window as { YT?: unknown }).YT;
  });

  it('injects the iframe api script and resolves on the ready callback', async () => {
    vi.resetModules();
    // Fresh module instance so the cached apiPromise does not leak in.
    const { loadYouTubeIframeApi: load } =
      await import('./load-youtube-iframe-api.helper');
    const appendChild = vi.spyOn(document.head, 'appendChild');

    void load();
    expect(appendChild).toHaveBeenCalled();
    const script = appendChild.mock.calls[0][0] as HTMLScriptElement;
    expect(script.src).toBe('https://www.youtube.com/iframe_api');
    expect(script.async).toBe(true);

    // Simulate the API arriving.
    window.onYouTubeIframeAPIReady?.();
    await expect(load()).resolves.toBeUndefined();

    appendChild.mockRestore();
  });

  it('chains an existing onYouTubeIframeAPIReady callback', async () => {
    vi.resetModules();
    const { loadYouTubeIframeApi: load } =
      await import('./load-youtube-iframe-api.helper');
    const previous = vi.fn();
    window.onYouTubeIframeAPIReady = previous;

    const promise = load();
    window.onYouTubeIframeAPIReady?.();
    await promise;
    expect(previous).toHaveBeenCalled();

    delete window.onYouTubeIframeAPIReady;
  });
});
