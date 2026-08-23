import { describe, expect, it } from 'vitest';
import { computed, provide } from 'vue';

import { runInSetup } from '@/test-utils/run-in-setup';
import type { MediaPresentations } from '@/types/harness-response-data.model';
import { mediaPresentationsKey } from '@/types/harness-response-data.model';

import { useHarnessMediaPresentation } from './use-harness-media-presentation.composable';

const PRESENTATIONS: MediaPresentations = {
  image: 'list',
  video: 'gallery',
};

describe('useHarnessMediaPresentation', () => {
  it('defaults to image gallery and video list without a provider', () => {
    const image = runInSetup(() => useHarnessMediaPresentation('image'));
    const video = runInSetup(() => useHarnessMediaPresentation('video'));

    expect(image.value).toBe('gallery');
    expect(video.value).toBe('list');
  });

  it('reads the presentation for its media type from the provider', () => {
    const image = runInSetup(
      () => useHarnessMediaPresentation('image'),
      () =>
        provide(
          mediaPresentationsKey,
          computed(() => PRESENTATIONS),
        ),
    );
    expect(image.value).toBe('list');
  });

  it('reads the video presentation independently', () => {
    const video = runInSetup(
      () => useHarnessMediaPresentation('video'),
      () =>
        provide(
          mediaPresentationsKey,
          computed(() => PRESENTATIONS),
        ),
    );
    expect(video.value).toBe('gallery');
  });
});
