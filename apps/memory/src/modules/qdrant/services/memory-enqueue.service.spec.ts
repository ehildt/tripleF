import type { Queue } from 'bullmq';
import { describe, expect, it, vi } from 'vitest';

import type { QdrantConfig } from '../models/qdrant-config.model.js';

import { MemoryEnqueueService } from './memory-enqueue.service.js';

const config = (enabled: boolean): QdrantConfig =>
  ({ enabled }) as QdrantConfig;

function makeService(enabled: boolean) {
  const addBulk = vi.fn().mockResolvedValue(undefined);
  const add = vi.fn().mockResolvedValue({ id: 'job-42' });
  const queue = { add, addBulk } as unknown as Queue;
  return {
    service: new MemoryEnqueueService(queue, config(enabled)),
    add,
    addBulk,
  };
}

describe('MemoryEnqueueService.enqueueTurn', () => {
  it('does nothing when the feature is disabled', async () => {
    const { service, addBulk } = makeService(false);
    await service.enqueueTurn({
      sessionId: 'sess-1',
      model: 'qwen3.8:27b',
      userText: 'hello',
      assistantText: 'hi there',
    });
    expect(addBulk).not.toHaveBeenCalled();
  });

  it('skips turns without a session id (no tenancy home)', async () => {
    const { service, addBulk } = makeService(true);
    await service.enqueueTurn({
      sessionId: undefined,
      model: 'qwen3.8:27b',
      userText: 'hello',
      assistantText: 'hi there',
    });
    expect(addBulk).not.toHaveBeenCalled();
  });

  it('enqueues one job per non-empty turn side', async () => {
    const { service, addBulk } = makeService(true);
    await service.enqueueTurn({
      sessionId: 'sess-1',
      conversationId: 'conv-1',
      model: 'qwen3.8:27b',
      userText: 'what is qdrant?',
      assistantText: 'a vector store.',
    });
    expect(addBulk).toHaveBeenCalledTimes(1);
    const jobs = addBulk.mock.calls[0][0] as Array<{ data: { role: string } }>;
    expect(jobs.map((job) => job.data.role)).toEqual(['user', 'assistant']);
  });

  it('skips empty sides', async () => {
    const { service, addBulk } = makeService(true);
    await service.enqueueTurn({
      sessionId: 'sess-1',
      model: 'qwen3.8:27b',
      userText: '   ',
      assistantText: 'ok',
    });
    const jobs = addBulk.mock.calls[0][0] as Array<{ data: { role: string } }>;
    expect(jobs.map((job) => job.data.role)).toEqual(['assistant']);
  });

  it('swallows enqueue errors (memory must never break the harness)', async () => {
    const { service, addBulk } = makeService(true);
    addBulk.mockRejectedValue(new Error('redis down'));
    await expect(
      service.enqueueTurn({
        sessionId: 'sess-1',
        model: 'qwen3.8:27b',
        userText: 'hello',
      }),
    ).resolves.toBeUndefined();
  });
});
