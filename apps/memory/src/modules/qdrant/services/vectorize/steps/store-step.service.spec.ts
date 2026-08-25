import { describe, expect, it, vi } from 'vitest';

import { deterministicPointId } from '../../../helpers/deterministic-point-id.helper.js';
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
  const step = new StoreStepService(
    { upsertBatch } as never,
    ledger as never,
    memoryEnqueue as never,
    { consolidateThreshold: 50 } as never,
  );
  return { step, upsertBatch, ledger, memoryEnqueue };
}

describe('StoreStepService', () => {
  it('upserts one point per fact with deterministic ids and tags', async () => {
    const { step, upsertBatch } = makeStep();

    const ctx = makeCtx({
      outputs: {
        extraction: { facts: ['User prefers concise.'], tags: ['style'] },
        vectors: [[1, 0, 0]],
      },
    });

    await step.execute(ctx);

    const call = upsertBatch.mock.calls[0][0] as {
      sessionId: string;
      role: string;
      conversationId?: string;
      requestId?: string;
      points: Array<{ id: string; text: string; tags: string[] }>;
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
  });

  it('stores nothing when the turn produced no facts', async () => {
    const { step, upsertBatch } = makeStep();

    await step.execute(makeCtx());

    expect(upsertBatch).not.toHaveBeenCalled();
  });
});
