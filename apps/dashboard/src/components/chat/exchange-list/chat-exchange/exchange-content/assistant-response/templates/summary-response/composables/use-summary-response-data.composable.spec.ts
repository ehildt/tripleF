import { describe, expect, it } from 'vitest';
import { computed, provide, reactive } from 'vue';

import { runInSetup } from '@/test-utils/run-in-setup';
import type { HarnessResponseData } from '@/types/harness-response-data.model';
import {
  type MediaPriority,
  mediaPriorityKey,
} from '@/types/harness-response-data.model';

import type { SummaryResponseProps } from '../SummaryResponse.types';
import { useSummaryResponseData } from './use-summary-response-data.composable';

function makeProps(data: HarnessResponseData): SummaryResponseProps {
  return reactive({ data });
}

describe('useSummaryResponseData', () => {
  it('reports content when any field is present', () => {
    const { hasAnyContent } = runInSetup(() =>
      useSummaryResponseData(makeProps({ title: 'Summary' })),
    );
    expect(hasAnyContent.value).toBe(true);
  });

  it('reports no content for an empty response', () => {
    const { hasAnyContent } = runInSetup(() =>
      useSummaryResponseData(makeProps({})),
    );
    expect(hasAnyContent.value).toBe(false);
  });

  it('counts a hero image as content', () => {
    const { hasAnyContent } = runInSetup(() =>
      useSummaryResponseData(makeProps({ heroImageUrl: 'https://i.jpg' })),
    );
    expect(hasAnyContent.value).toBe(true);
  });

  it('orders videos first when the context says so', () => {
    const { videosFirst } = runInSetup(
      () => useSummaryResponseData(makeProps({})),
      () =>
        provide(
          mediaPriorityKey,
          computed(() => 'videos' as MediaPriority),
        ),
    );
    expect(videosFirst.value).toBe(true);
  });
});
