import { describe, expect, it, vi } from 'vitest';

import { createMemoryCognitionDeleteTool } from './memory-cognition-delete.tool.js';

const scope = {
  memoryPartition: 'christopher',
  memoryCognition: 'christopher-cognition',
  sessionId: 'sess-1',
  conversationId: 'conv-1',
};

describe('createMemoryCognitionDeleteTool', () => {
  it('deletes the verbatim insight and confirms the removed text', async () => {
    const deleteCognitionRecords = vi.fn().mockResolvedValue({
      deleted: 1,
      texts: ['The user likes jazz'],
      pruned: [],
    });
    const tool = createMemoryCognitionDeleteTool({ scope, deleteCognitionRecords });

    const result = await tool.execute!({ text: 'The user likes jazz' }, {} as never);

    expect(deleteCognitionRecords).toHaveBeenCalledWith({
      memoryCognition: 'christopher-cognition',
      text: 'The user likes jazz',
      path: undefined,
    });
    expect(result).toEqual({ deleted: 1, removed: ['The user likes jazz'], pruned: [] });
  });

  it('prunes a profile topic by path and confirms the pruned value', async () => {
    const deleteCognitionRecords = vi.fn().mockResolvedValue({
      deleted: 0,
      texts: [],
      pruned: ['jazz'],
    });
    const tool = createMemoryCognitionDeleteTool({ scope, deleteCognitionRecords });

    const result = await tool.execute!({ path: 'likes.jazz' }, {} as never);

    expect(result).toEqual({ deleted: 0, removed: [], pruned: ['jazz'] });
  });

  it('falls back to the partition key when no cognition space is set', async () => {
    const deleteCognitionRecords = vi.fn().mockResolvedValue({ deleted: 0, texts: [], pruned: [] });
    const tool = createMemoryCognitionDeleteTool({
      scope: { memoryPartition: 'christopher' },
      deleteCognitionRecords,
    });

    await tool.execute!({ text: 'The user likes jazz' }, {} as never);

    expect(deleteCognitionRecords).toHaveBeenCalledWith(expect.objectContaining({ memoryCognition: 'christopher' }));
  });

  it('rejects a both-empty call without touching the store', async () => {
    const deleteCognitionRecords = vi.fn();
    const tool = createMemoryCognitionDeleteTool({ scope, deleteCognitionRecords });

    const result = await tool.execute!({}, {} as never);

    expect(deleteCognitionRecords).not.toHaveBeenCalled();
    expect(result).toEqual({
      deleted: 0,
      pruned: [],
      error: 'Pass text (verbatim insight) and/or path (profile topic) — a targeted delete needs at least one.',
    });
  });

  it('reports a no-match honestly', async () => {
    const deleteCognitionRecords = vi.fn().mockResolvedValue({ deleted: 0, texts: [], pruned: [] });
    const tool = createMemoryCognitionDeleteTool({ scope, deleteCognitionRecords });

    const result = await tool.execute!({ text: 'not stored' }, {} as never);

    expect(result).toEqual({
      deleted: 0,
      pruned: [],
      message:
        'No stored insight matches that exact text or path — quote the insight verbatim from your injected cognition context, or name the profile path exactly (e.g. "likes.jazz").',
    });
  });

  it('returns an honest error instead of throwing when the delete fails', async () => {
    const deleteCognitionRecords = vi.fn().mockRejectedValue(new Error('store down'));
    const tool = createMemoryCognitionDeleteTool({ scope, deleteCognitionRecords });

    const result = await tool.execute!({ text: 'Doomed insight' }, {} as never);

    expect(result).toEqual({ deleted: 0, pruned: [], error: 'store down' });
  });
});
