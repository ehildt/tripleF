import { describe, expect, it } from 'vitest';

import type { VectorizeContext } from './vectorize-context.type.js';
import { VectorizeStepEngineService } from './vectorize-step-engine.service.js';
import { VectorizeStepRegistryService } from './vectorize-step-registry.service.js';

function makeCtx(): VectorizeContext {
  return {
    jobId: 'job-1',
    job: {} as never,
    memoryPartition: 'sess-1',
    sessionId: 'sess-1',
    role: 'user',
    text: 'text',
    steps: new Map(),
    outputs: {},
    done: false,
  };
}

function makeEngine() {
  const registry = new VectorizeStepRegistryService();
  const engine = new VectorizeStepEngineService(registry);
  return { engine, registry };
}

describe('VectorizeStepEngineService', () => {
  it('runs steps in dependency order until the goal is finished', async () => {
    const { engine, registry } = makeEngine();
    const calls: string[] = [];

    registry
      .addStep('extract', { execute: async () => void calls.push('extract') })
      .addStep('embed', { execute: async () => void calls.push('embed') }, [
        'extract',
      ])
      .addStep('store', { execute: async () => void calls.push('store') }, [
        'embed',
      ]);

    const ctx = makeCtx();
    for (const id of registry.registry.keys()) {
      ctx.steps.set(id, { status: 'idle' });
    }

    await engine.run(ctx);

    expect(calls).toEqual(['extract', 'embed', 'store']);
    expect(engine.isGoalFinished(ctx)).toBe(true);
  });

  it('skips upstream-of-done turns: extract short-circuits empty text', async () => {
    const { engine, registry } = makeEngine();
    const calls: string[] = [];

    registry
      .addStep('extract', {
        execute: async (ctx) => {
          ctx.done = true; // no extractable text
        },
      })
      .addStep('embed', { execute: async () => void calls.push('embed') });

    const ctx = makeCtx();
    for (const id of registry.registry.keys()) {
      ctx.steps.set(id, { status: 'idle' });
    }

    await engine.run(ctx);

    expect(calls).toEqual([]); // embed never ran
    expect(ctx.done).toBe(true);
  });

  it('marks the failed step, stops the run, and rethrows for the queue', async () => {
    const { engine, registry } = makeEngine();
    registry.addStep('embed', {
      execute: async () => {
        throw new Error('boom');
      },
    });

    const ctx = makeCtx();
    for (const id of registry.registry.keys()) {
      ctx.steps.set(id, { status: 'idle' });
    }

    await expect(engine.run(ctx)).rejects.toThrow('boom');

    expect(ctx.steps.get('embed')).toEqual({ status: 'error', error: 'boom' });
    expect(ctx.done).toBe(true);
    expect(ctx.error).toBe('boom');
  });
});
