import { describe, expect, it } from 'vitest';
import { computed, provide, reactive } from 'vue';

import { runInSetup } from '@/test-utils/run-in-setup';
import type { HarnessResponseData } from '@/types/harness-response-data.model';
import {
  type MediaPriority,
  mediaPriorityKey,
} from '@/types/harness-response-data.model';

import type { EvaluationResponseProps } from '../EvaluationResponse.types';
import { useEvaluationResponseData } from './use-evaluation-response-data.composable';

function makeProps(data: HarnessResponseData): EvaluationResponseProps {
  return reactive({ data });
}

describe('useEvaluationResponseData', () => {
  it('prefers the score label over the numeric score', () => {
    const { subjectProfiles } = runInSetup(() =>
      useEvaluationResponseData(
        makeProps({ subject: 'NTE', scoreLabel: 'Strong buy', score: 4 }),
      ),
    );
    expect(subjectProfiles.value[0].scoreText).toBe('Strong buy');
  });

  it('falls back to the numeric score', () => {
    const { subjectProfiles } = runInSetup(() =>
      useEvaluationResponseData(makeProps({ subject: 'NTE', score: 4 })),
    );
    expect(subjectProfiles.value[0].scoreText).toBe('4/10');
  });

  it('reports content when any field is present', () => {
    const { hasAnyContent } = runInSetup(() =>
      useEvaluationResponseData(makeProps({ verdict: 'Pass' })),
    );
    expect(hasAnyContent.value).toBe(true);
  });

  it('reports no content for an empty response', () => {
    const { hasAnyContent } = runInSetup(() =>
      useEvaluationResponseData(makeProps({})),
    );
    expect(hasAnyContent.value).toBe(false);
  });

  it('orders videos first when the context says so', () => {
    const { videosFirst } = runInSetup(
      () => useEvaluationResponseData(makeProps({})),
      () =>
        provide(
          mediaPriorityKey,
          computed(() => 'videos' as MediaPriority),
        ),
    );
    expect(videosFirst.value).toBe(true);
  });
});
