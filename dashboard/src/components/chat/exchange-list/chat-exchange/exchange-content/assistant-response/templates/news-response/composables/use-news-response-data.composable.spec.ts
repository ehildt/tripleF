import { describe, expect, it } from 'vitest';
import { computed, provide, reactive } from 'vue';

import { runInSetup } from '@/test-utils/run-in-setup';
import type { HarnessResponseData } from '@/types/harness-response-data.model';
import {
  type MediaPriority,
  mediaPriorityKey,
} from '@/types/harness-response-data.model';

import type { NewsResponseProps } from '../NewsResponse.types';
import { useNewsResponseData } from './use-news-response-data.composable';

function makeProps(data: HarnessResponseData): NewsResponseProps {
  return reactive({ data });
}

describe('useNewsResponseData', () => {
  it('reports content when any field is present', () => {
    const { hasAnyContent } = runInSetup(() =>
      useNewsResponseData(makeProps({ headline: 'Headline' })),
    );
    expect(hasAnyContent.value).toBe(true);
  });

  it('reports no content for an empty response', () => {
    const { hasAnyContent } = runInSetup(() =>
      useNewsResponseData(makeProps({})),
    );
    expect(hasAnyContent.value).toBe(false);
  });

  it('counts related stories as content', () => {
    const { hasAnyContent } = runInSetup(() =>
      useNewsResponseData(makeProps({ relatedStories: [{ title: 'Story' }] })),
    );
    expect(hasAnyContent.value).toBe(true);
  });

  it('orders videos first when the context says so', () => {
    const { videosFirst } = runInSetup(
      () => useNewsResponseData(makeProps({})),
      () =>
        provide(
          mediaPriorityKey,
          computed(() => 'videos' as MediaPriority),
        ),
    );
    expect(videosFirst.value).toBe(true);
  });
});
