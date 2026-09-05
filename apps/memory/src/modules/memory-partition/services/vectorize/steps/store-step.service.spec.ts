import { describe, expect, it, vi } from 'vitest';

import { deterministicPointId } from '../../../../qdrant/helpers/deterministic-point-id.helper.js';
import type { VectorizeContext } from '../vectorize-context.type.js';

import { StoreStepService } from './store-step.service.js';

function makeCtx(overrides: Partial<VectorizeContext> = {}): VectorizeContext {
  return {
    jobId: 'job-1',
    job: {} as never,
    memoryPartition: 'sess-1',
    sessionId: 'sess-1',
    role: 'user',
    conversationId: 'conv-1',
    requestId: 'req-1',
    text: 'First sentence. Second sentence.',
    steps: new Map(),
    outputs: {},
    done: false,
    ...overrides,
  };
}

function makeStep() {
  const upsertBatch = vi.fn().mockResolvedValue(undefined);
  const ledger = {
    insertMany: vi.fn().mockResolvedValue(undefined),
    countPending: vi.fn().mockResolvedValue(0),
  };
  const memoryEnqueue = {
    enqueueConsolidateJob: vi.fn().mockResolvedValue(undefined),
  };
  const overrides = {
    getConsolidateModel: vi.fn().mockReturnValue(undefined),
  };
  const step = new StoreStepService(
    { upsertBatch } as never,
    ledger as never,
    memoryEnqueue as never,
    overrides as never,
    { consolidateThreshold: 50 } as never,
  );
  return { step, upsertBatch, ledger, memoryEnqueue };
}

describe('StoreStepService', () => {
  it('upserts one point per fact with deterministic ids and tags', async () => {
    const { step, upsertBatch } = makeStep();

    const ctx = makeCtx({
      outputs: {
        extraction: {
          facts: [
            {
              text: 'User prefers concise.',
              subject: 'user',
              kind: 'preference' as const,
              stability: 'durable' as const,
            },
          ],
          tags: ['style'],
        },
        vectors: [[1, 0, 0]],
      },
    });

    await step.execute(ctx);

    const call = upsertBatch.mock.calls[0][0] as {
      sessionId: string;
      role: string;
      conversationId?: string;
      requestId?: string;
      points: Array<{
        id: string;
        text: string;
        tags: string[];
        subject?: string;
        kind?: string;
        stability?: string;
      }>;
    };
    expect(call.sessionId).toBe('sess-1');
    expect(call.role).toBe('user');
    expect(call.conversationId).toBe('conv-1');
    expect(call.requestId).toBe('req-1');
    expect(call.points).toHaveLength(1);
    expect(call.points[0].id).toBe(
      deterministicPointId('sess-1|user|User prefers concise.'),
    );
    expect(call.points[0].tags).toEqual(['style']);
    expect(call.points[0].subject).toBe('user');
    expect(call.points[0].kind).toBe('preference');
    expect(call.points[0].stability).toBe('durable');
  });

  it('stores nothing when the turn produced no facts', async () => {
    const { step, upsertBatch } = makeStep();

    await step.execute(makeCtx());

    expect(upsertBatch).not.toHaveBeenCalled();
  });
});
