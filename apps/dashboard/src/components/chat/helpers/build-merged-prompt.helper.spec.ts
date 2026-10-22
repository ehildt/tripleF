import { describe, expect, it } from 'vitest';

import type { Exchange } from '@/stores/conversation/conversation.model';

import { buildMergedPromptContent } from './build-merged-prompt.helper';

function exchange(
  requestId: string,
  role: 'user' | 'assistant',
  content: string,
): Exchange {
  return {
    requestId,
    role,
    status: 'done',
    content,
  } as unknown as Exchange;
}

describe('buildMergedPromptContent', () => {
  it('emits the merge-request marker and numbered sections with request ids', () => {
    const prompt = buildMergedPromptContent([
      exchange('r1', 'user', 'Do a thing'),
      exchange('r2', 'assistant', 'Done'),
    ]);
    expect(prompt).toContain('[MERGE REQUEST]');
    expect(prompt).toContain('[1] USER REQUEST (request id: r1):\nDo a thing');
    expect(prompt).toContain('[2] ASSISTANT ANSWER (request id: r2):\nDone');
  });

  it('embeds the assistant harness data as structured JSON, not text', () => {
    const withData = {
      requestId: 'r2',
      role: 'assistant',
      status: 'done',
      responseData: { title: 'T' },
      responseTemplate: 'article',
    } as unknown as Exchange;
    const prompt = buildMergedPromptContent([withData]);
    expect(prompt).toContain('ASSISTANT ANSWER');
    expect(prompt).toContain('"template":"article"');
    expect(prompt).toContain('"data":{"title":"T"}');
  });

  it('appends an additional instruction when provided', () => {
    const prompt = buildMergedPromptContent([exchange('r1', 'user', 'x')], {
      extraInstruction: 'prioritize videos',
    });
    expect(prompt).toContain('ADDITIONAL INSTRUCTION:');
    expect(prompt).toContain('prioritize videos');
  });

  it('uses "(no content)" for an empty exchange', () => {
    const prompt = buildMergedPromptContent([exchange('r1', 'user', '   ')]);
    expect(prompt).toContain('(no content)');
  });
});
