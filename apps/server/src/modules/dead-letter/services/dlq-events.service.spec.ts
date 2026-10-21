import { SocketIOService } from '@triplef/socketio';
import { describe, expect, it, vi } from 'vitest';

import type { DeadLetterJob } from '../../../generated/prisma/client.js';

import { DlqEventsService } from './dlq-events.service.js';

describe('DlqEventsService', () => {
  function makeService() {
    const emit = vi.fn();
    const service = new DlqEventsService({
      emit,
    } as unknown as SocketIOService);
    return { emit, service };
  }

  const makeEntry = (overrides: Partial<DeadLetterJob> = {}): DeadLetterJob =>
    ({
      id: 'rec-1',
      queueName: 'harness',
      jobId: 'job-1',
      jobName: 'req-1',
      status: 'Failed',
      payload: { filters: { model: 'llama3' } },
      retryConfig: null,
      failedReason: 'boom',
      failedAt: new Date('2026-01-15T09:30:00.000Z'),
      attemptsMade: 3,
      totalAttempts: 3,
      failureHistory: null,
      nextRetryAt: new Date('2026-01-15T09:31:00.000Z'),
      createdAt: new Date('2026-01-15T09:00:00.000Z'),
      updatedAt: new Date('2026-01-15T09:30:00.000Z'),
      ...overrides,
    }) as DeadLetterJob;

  it('broadcasts an entry-upserted envelope with the serialized row', () => {
    const { emit, service } = makeService();

    service.broadcastEntryUpserted(makeEntry());

    expect(emit).toHaveBeenCalledTimes(1);
    const [topic, envelope] = emit.mock.calls[0];
    expect(topic).toBe('dlq:entry-upserted');
    expect(envelope.v).toBe(1);
    expect(envelope.kind).toBe('event');
    expect(envelope.type).toBe('dlq:entry-upserted');
    expect(envelope.data.entry.id).toBe('rec-1');
    // Dates cross the wire as ISO strings.
    expect(envelope.data.entry.failedAt).toBe('2026-01-15T09:30:00.000Z');
    expect(envelope.data.entry.nextRetryAt).toBe('2026-01-15T09:31:00.000Z');
  });

  it('broadcasts an entries-removed envelope carrying the erased ids', () => {
    const { emit, service } = makeService();

    service.broadcastEntriesRemoved(['rec-1', 'rec-2']);

    expect(emit).toHaveBeenCalledTimes(1);
    const [topic, envelope] = emit.mock.calls[0];
    expect(topic).toBe('dlq:entries-removed');
    expect(envelope.type).toBe('dlq:entries-removed');
    expect(envelope.data.ids).toEqual(['rec-1', 'rec-2']);
  });

  it('broadcasts a payload-less bulk-changed envelope', () => {
    const { emit, service } = makeService();

    service.broadcastBulkChanged();

    expect(emit).toHaveBeenCalledTimes(1);
    const [topic, envelope] = emit.mock.calls[0];
    expect(topic).toBe('dlq:bulk-changed');
    expect(envelope.type).toBe('dlq:bulk-changed');
    expect(envelope.data).toEqual({});
  });
});
