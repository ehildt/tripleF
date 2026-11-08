import { describe, expect, it } from 'vitest';

import { buildAssistantRetryReset } from './build-assistant-retry-reset.helper';

describe('buildAssistantRetryReset', () => {
  it('restores pending state and clears response and token fields', () => {
    expect(
      buildAssistantRetryReset(
        { model: 'llama', event: 'harness', roomId: 'room' },
        'server-1',
      ),
    ).toMatchObject({
      content: '',
      status: 'pending',
      model: 'llama',
      event: 'harness',
      roomId: 'room',
      conversationId: 'server-1',
      promptEvalCount: undefined,
      evalCount: undefined,
      inputTokenDelta: undefined,
      responseData: undefined,
      responseTemplate: undefined,
      chartData: undefined,
    });
  });
});
