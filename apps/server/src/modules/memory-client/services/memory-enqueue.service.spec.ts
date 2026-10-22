import { describe, expect, it, vi } from 'vitest';

import { MemoryEnqueueService } from './memory-enqueue.service.js';

const queue = () => ({
  addBulk: vi.fn().mockResolvedValue([]),
  add: vi.fn().mockResolvedValue({}),
});

const service = (fakeQueue = queue(), enabled = true) =>
  new MemoryEnqueueService(fakeQueue as never, { enabled } as never);

const turn = {
  model: 'qwen3.8:27b',
  sessionId: 'sess-1',
  conversationId: 'conv-1',
  requestId: 'req-1',
  userText: 'Hello',
  assistantText: 'Hi there',
};

describe('MemoryEnqueueService', () => {
  describe('enqueueTurn', () => {
    it('enqueues one vectorize job per turn side', async () => {
      const fakeQueue = queue();

      await service(fakeQueue).enqueueTurn(turn);

      expect(fakeQueue.addBulk).toHaveBeenCalledWith([
        {
          name: 'vectorize',
          data: {
            memoryPartition: 'sess-1',
            sessionId: 'sess-1',
            conversationId: 'conv-1',
            requestId: 'req-1',
            model: 'qwen3.8:27b',
            role: 'user',
            text: 'Hello',
          },
        },
        {
          name: 'vectorize',
          data: {
            memoryPartition: 'sess-1',
            sessionId: 'sess-1',
            conversationId: 'conv-1',
            requestId: 'req-1',
            model: 'qwen3.8:27b',
            role: 'assistant',
            text: 'Hi there',
          },
        },
      ]);
    });

    it('prefers an explicit fact partition over the session id', async () => {
      const fakeQueue = queue();

      await service(fakeQueue).enqueueTurn({
        ...turn,
        memoryPartition: 'user-1',
      });

      expect(fakeQueue.addBulk.mock.calls[0][0][0].data.memoryPartition).toBe(
        'user-1',
      );
    });

    it('skips sides that are blank', async () => {
      const fakeQueue = queue();

      await service(fakeQueue).enqueueTurn({
        ...turn,
        userText: '   ',
        assistantText: 'Hi there',
      });

      expect(fakeQueue.addBulk.mock.calls[0][0]).toHaveLength(1);
    });

    it('does not enqueue a turn with no text at all', async () => {
      const fakeQueue = queue();

      await service(fakeQueue).enqueueTurn({
        ...turn,
        userText: undefined,
        assistantText: '  ',
      });

      expect(fakeQueue.addBulk).not.toHaveBeenCalled();
    });

    it('does not enqueue without a partition or session', async () => {
      const fakeQueue = queue();

      await service(fakeQueue).enqueueTurn({
        ...turn,
        sessionId: undefined,
        memoryPartition: undefined,
      });

      expect(fakeQueue.addBulk).not.toHaveBeenCalled();
    });

    it('no-ops when memory is disabled', async () => {
      const fakeQueue = queue();

      await service(fakeQueue, false).enqueueTurn(turn);

      expect(fakeQueue.addBulk).not.toHaveBeenCalled();
    });

    it('swallows queue failures — memory never breaks the request path', async () => {
      const fakeQueue = queue();
      fakeQueue.addBulk.mockRejectedValue(new Error('redis down'));

      await expect(
        service(fakeQueue).enqueueTurn(turn),
      ).resolves.toBeUndefined();
    });
  });

  describe('enqueueProfileJob', () => {
    it('adds the cognition profile job under its own name', async () => {
      const fakeQueue = queue();
      const data = { memoryCognition: 'ai-1', requestId: 'req-1' } as never;

      await service(fakeQueue).enqueueProfileJob(data);

      expect(fakeQueue.add).toHaveBeenCalledWith('memory-profile', data);
    });

    it('no-ops when disabled and swallows queue failures', async () => {
      const disabled = queue();
      const failing = queue();
      failing.add.mockRejectedValue(new Error('redis down'));
      const data = { memoryCognition: 'ai-1', requestId: 'req-1' } as never;

      await service(disabled, false).enqueueProfileJob(data);
      await expect(
        service(failing).enqueueProfileJob(data),
      ).resolves.toBeUndefined();
      expect(disabled.add).not.toHaveBeenCalled();
    });
  });
});
