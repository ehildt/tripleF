import { describe, expect, it, vi } from 'vitest';

import { createMemoryCognitionRememberTool } from './memory-cognition-remember.tool.js';

const scope = {
  memoryPartition: 'christopher',
  memoryCognition: 'christopher-cognition',
  sessionId: 'sess-1',
  conversationId: 'conv-1',
};

describe('createMemoryCognitionRememberTool', () => {
  it('stores the insight with the cognition scope and optional path', async () => {
    const storeInsight = vi.fn().mockResolvedValue('insight-1');
    const tool = createMemoryCognitionRememberTool({ scope, storeInsight });

    const result = await tool.execute!(
      { text: 'The user prefers single-line if statements', path: 'preferences.code' },
      {} as never,
    );

    expect(storeInsight).toHaveBeenCalledWith({
      memoryCognition: 'christopher-cognition',
      sessionId: 'sess-1',
      conversationId: 'conv-1',
      requestId: undefined,
      text: 'The user prefers single-line if statements',
      path: 'preferences.code',
    });
    expect(result).toEqual({ stored: true, id: 'insight-1' });
  });

  it('falls back to the partition key when no cognition space is set', async () => {
    const storeInsight = vi.fn().mockResolvedValue('insight-2');
    const tool = createMemoryCognitionRememberTool({
      scope: { memoryPartition: 'christopher' },
      storeInsight,
    });

    await tool.execute!({ text: 'The user works in Rust' }, {} as never);

    expect(storeInsight).toHaveBeenCalledWith(expect.objectContaining({ memoryCognition: 'christopher' }));
  });

  it('returns an honest error instead of throwing when the store fails', async () => {
    const storeInsight = vi.fn().mockRejectedValue(new Error('embed down'));
    const tool = createMemoryCognitionRememberTool({ scope, storeInsight });

    const result = await tool.execute!({ text: 'Doomed insight' }, {} as never);

    expect(result).toEqual({ stored: false, error: 'embed down' });
  });
});
