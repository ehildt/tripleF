import { describe, expect, it, vi } from 'vitest';

import { createMemoryCognitionForgetTool } from './memory-cognition-forget.tool.js';

const scope = {
  memoryPartition: 'christopher',
  memoryCognition: 'christopher-cognition',
  sessionId: 'sess-1',
  conversationId: 'conv-1',
};

describe('createMemoryCognitionForgetTool', () => {
  it('wipes the cognition space and confirms the removed records', async () => {
    const deleteCognition = vi.fn().mockResolvedValue(['profile', 'insight-1']);
    const tool = createMemoryCognitionForgetTool({ scope, deleteCognition });

    const result = await tool.execute!({}, {} as never);

    expect(deleteCognition).toHaveBeenCalledWith('christopher-cognition');
    expect(result).toEqual({
      deleted: 2,
      removed: ['profile', 'insight-1'],
      note: 'Your cognition space of this user was wiped (profile and insights) — understanding is forgotten, fact records are untouched.',
    });
  });

  it('falls back to the partition key when no cognition space is set', async () => {
    const deleteCognition = vi.fn().mockResolvedValue([]);
    const tool = createMemoryCognitionForgetTool({
      scope: { memoryPartition: 'christopher' },
      deleteCognition,
    });

    await tool.execute!({}, {} as never);

    expect(deleteCognition).toHaveBeenCalledWith('christopher');
  });

  it('reports an empty cognition space honestly', async () => {
    const deleteCognition = vi.fn().mockResolvedValue([]);
    const tool = createMemoryCognitionForgetTool({ scope, deleteCognition });

    const result = await tool.execute!({}, {} as never);

    expect(result).toEqual({
      deleted: 0,
      message: 'No cognition exists for this user.',
    });
  });

  it('returns an honest error instead of throwing when the wipe fails', async () => {
    const deleteCognition = vi.fn().mockRejectedValue(new Error('store down'));
    const tool = createMemoryCognitionForgetTool({ scope, deleteCognition });

    const result = await tool.execute!({}, {} as never);

    expect(result).toEqual({ deleted: 0, error: 'store down' });
  });
});
