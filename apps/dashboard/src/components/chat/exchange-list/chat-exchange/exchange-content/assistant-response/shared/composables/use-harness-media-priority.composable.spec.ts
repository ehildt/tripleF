import { computed, provide } from 'vue';

import { runInSetup } from '@/test-utils/run-in-setup';
import {
  type MediaPriority,
  mediaPriorityKey,
} from '@/types/harness-response-data.model';

import { useHarnessMediaPriority } from './use-harness-media-priority.composable';

describe('useHarnessMediaPriority', () => {
  it('prefers the hero video over the hero image', () => {
    const { heroUrl } = runInSetup(() =>
      useHarnessMediaPriority({
        heroVideoUrl: 'https://example.com/v.mp4',
        heroImageUrl: 'https://example.com/i.jpg',
      }),
    );
    expect(heroUrl.value).toBe('https://example.com/v.mp4');
  });

  it('falls back to the hero image when there is no video', () => {
    const { heroUrl } = runInSetup(() =>
      useHarnessMediaPriority({ heroImageUrl: 'https://example.com/i.jpg' }),
    );
    expect(heroUrl.value).toBe('https://example.com/i.jpg');
  });

  it('resolves no hero URL when neither media is present', () => {
    const { heroUrl } = runInSetup(() => useHarnessMediaPriority({}));
    expect(heroUrl.value).toBeUndefined();
  });

  it('defaults to images-first ordering', () => {
    const { videosFirst } = runInSetup(() => useHarnessMediaPriority({}));
    expect(videosFirst.value).toBe(false);
  });

  it('orders videos first when the context says so', () => {
    const { videosFirst } = runInSetup(
      () => useHarnessMediaPriority({}),
      () =>
        provide(
          mediaPriorityKey,
          computed(() => 'videos' as MediaPriority),
        ),
    );
    expect(videosFirst.value).toBe(true);
  });
});
