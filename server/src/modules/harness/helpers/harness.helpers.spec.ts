import { SocketIOService } from '@ehildt/nestjs-socket.io';
import { Job } from 'bullmq';
import { describe, expect, it, vi } from 'vitest';

import type { InputMessage } from '../../ai-sdk/helpers/ai-sdk-message.models.js';
import { HarnessJobPayload } from '../dtos/harness-job.dto.js';

import {
  buildChatRequest,
  buildGalleryItems,
  emitToSocket,
  isCompactTask,
  stripImagesFromMessages,
} from './harness.helpers.js';

function createJob(
  filters: Partial<HarnessJobPayload['filters']> = {},
): Job<HarnessJobPayload> {
  return {
    name: 'req-1',
    data: { meta: [], filters },
  } as Job<HarnessJobPayload>;
}

describe('isCompactTask', () => {
  it('returns true when the compact flag is set', () => {
    const job = createJob({ compact: true });
    expect(isCompactTask(job)).toBe(true);
  });

  it('returns false when the compact flag is missing or false', () => {
    const jobWithoutCompact = createJob();
    const jobWithFalseCompact = createJob({ compact: false });

    expect(isCompactTask(jobWithoutCompact)).toBe(false);
    expect(isCompactTask(jobWithFalseCompact)).toBe(false);
  });
});

describe('buildChatRequest', () => {
  it('builds a text-only request', () => {
    const result = buildChatRequest(
      [],
      '',
      {
        model: 'llama3',
        numCtx: 4096,
        stream: false,
        event: 'harness',
        think: 'medium',
        prompt: [{ role: 'user', content: 'hello' } as InputMessage],
      },
      '5m',
    );

    expect(result.messages).toHaveLength(2);
    expect(result.messages[0].role).toBe('system');
    expect(result.messages[1]).toEqual({
      role: 'user',
      content: 'hello',
    });
    expect(result.options).toEqual({ num_ctx: 4096 });
    expect(result.model).toBe('llama3');
    expect(result.keep_alive).toBe('5m');
    expect(result.think).toBe('medium');
  });

  it('builds an image request with variant descriptions', () => {
    const buffer = Buffer.from('image');
    const result = buildChatRequest(
      [buffer],
      'a.png (hash: h)',
      {
        model: 'llama3',
        numCtx: 4096,
        stream: true,
        event: 'harness',
        think: false,
      },
      '5m',
      ['original', 'grayscale'],
    );

    expect(result.messages).toHaveLength(2);
    expect(result.messages[1]).toEqual({
      role: 'user',
      images: [buffer],
      content: 'Image(s):\na.png (hash: h)\n1. original\n2. grayscale',
    });
    expect(result.stream).toBe(true);
    expect(result.think).toBe(false);
  });

  it('appends a vision-exclusion notice to the system prompt', () => {
    const result = buildChatRequest(
      [],
      '',
      {
        model: 'llama3',
        numCtx: 4096,
        stream: false,
        event: 'harness',
        think: 'low',
        prompt: [{ role: 'user', content: 'hello' } as InputMessage],
      },
      '5m',
      undefined,
      'The selected model does not support vision.',
    );

    expect(result.messages[0].role).toBe('system');
    expect(result.messages[0].content).toContain(
      'The selected model does not support vision.',
    );
  });

  it('filters out empty prompts', () => {
    const result = buildChatRequest(
      [],
      '',
      {
        model: 'llama3',
        numCtx: 4096,
        stream: false,
        event: 'harness',
        think: 'low',
        prompt: [
          { role: 'user', content: 'valid' } as InputMessage,
          { role: 'user', content: '   ' } as InputMessage,
          { role: 'system', content: '' } as InputMessage,
        ],
      },
      '5m',
    );

    expect(result.messages).toHaveLength(2);
    expect(result.messages[1]).toEqual({ role: 'user', content: 'valid' });
  });
});

describe('stripImagesFromMessages', () => {
  it('removes image arrays from messages', () => {
    const messages: InputMessage[] = [
      { role: 'user', content: 'hello', images: [Buffer.from('img')] },
      { role: 'assistant', content: 'ok' },
    ];
    const result = stripImagesFromMessages(messages);

    expect(result[0].images).toBeUndefined();
    expect(result[0].content).toBe('hello');
    expect(result[1]).toEqual({ role: 'assistant', content: 'ok' });
  });

  it('does not mutate the original messages', () => {
    const original: InputMessage[] = [
      { role: 'user', content: 'hello', images: [Buffer.from('img')] },
    ];
    stripImagesFromMessages(original);

    expect(original[0].images).toHaveLength(1);
  });
});

describe('emitToSocket', () => {
  it('emits to a room when roomId is provided', async () => {
    const emitTo = vi.fn();
    const io = { emitTo } as unknown as SocketIOService;

    await emitToSocket(io, 'room-1', 'harness', { foo: 'bar' });

    expect(emitTo).toHaveBeenCalledWith('harness', 'room-1', {
      event: 'harness',
      foo: 'bar',
    });
  });

  it('broadcasts when roomId is undefined', async () => {
    const emit = vi.fn();
    const io = { emit } as unknown as SocketIOService;

    await emitToSocket(io, undefined, 'custom', { foo: 'bar' });

    expect(emit).toHaveBeenCalledWith('custom', {
      event: 'custom',
      foo: 'bar',
    });
  });

  it('defaults event to harness', async () => {
    const emit = vi.fn();
    const io = { emit } as unknown as SocketIOService;

    await emitToSocket(io, undefined, undefined, { foo: 'bar' });

    expect(emit).toHaveBeenCalledWith('harness', {
      event: 'harness',
      foo: 'bar',
    });
  });

  it('swallows errors from the socket service', async () => {
    const io = {
      emitTo: vi.fn().mockImplementation(() => {
        throw new Error('socket down');
      }),
    } as unknown as SocketIOService;

    await expect(
      emitToSocket(io, 'room-1', 'harness', { foo: 'bar' }),
    ).resolves.toBeUndefined();
  });
});

describe('buildGalleryItems', () => {
  it('creates gallery items pointing to the original MinIO URL', () => {
    const items = buildGalleryItems('sess-1', 'conv-1', [
      { name: 'a.png', type: 'image/png', hash: 'h', variant: 'original' },
    ]);

    expect(items).toHaveLength(1);
    expect(items[0].imageUrl).toBe('/api/v1/storage/sess-1/conv-1/h');
    expect(items[0].originalUrl).toBeUndefined();
    expect(items[0].imageAlt).toBe('a.png');
  });

  it('omits the imageUrl when sessionId is missing', () => {
    const items = buildGalleryItems(undefined, 'conv-1', [
      { name: 'a.png', type: 'image/png', hash: 'h', variant: 'original' },
    ]);

    expect(items[0].imageUrl).toBe('');
  });

  it('filters out preprocessing variants from the client gallery', () => {
    const items = buildGalleryItems('sess-1', 'conv-1', [
      { name: 'a.png', type: 'image/png', hash: 'h1', variant: 'original' },
      {
        name: 'a_grayscale.png',
        type: 'image/png',
        hash: 'h2',
        variant: 'grayscale',
      },
    ]);

    expect(items).toHaveLength(1);
    expect(items[0].imageAlt).toBe('a.png');
    expect(items[0].imageUrl).toBe('/api/v1/storage/sess-1/conv-1/h1');
  });
});
