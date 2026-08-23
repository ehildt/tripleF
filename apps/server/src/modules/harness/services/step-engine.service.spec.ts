import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';

import { HarnessContext, StepId, StepState } from './harness-context.type.js';
import { StepHandler } from './harness-step.interface.js';
import { HarnessStepEngineService } from './harness-step-engine.service.js';
import { HarnessStepLogger } from './harness-step-logger.service.js';
import { StepRegistryService } from './step-registry.service.js';

function createContext(partial: Partial<HarnessContext> = {}): HarnessContext {
  return {
    requestId: 'req-1',
    job: { name: 'req-1', data: { meta: [], filters: {} } } as any,
    filters: {},
    model: 'model',
    request: { messages: [], options: {}, model: 'model', keep_alive: '5m' },
    processedMeta: [],
    buffers: [],
    stream: false,
    steps: new Map<StepId, StepState>([['interpret', { status: 'idle' }]]),
    outputs: { toolResults: [] },
    done: false,
    ...partial,
  } as HarnessContext;
}

describe('HarnessStepEngineService', () => {
  let service: HarnessStepEngineService;
  let registryService: StepRegistryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HarnessStepEngineService,
        StepRegistryService,
        {
          provide: HarnessStepLogger,
          useValue: { log: vi.fn(), warn: vi.fn(), error: vi.fn() },
        },
      ],
    }).compile();

    service = module.get<HarnessStepEngineService>(HarnessStepEngineService);
    registryService = module.get<StepRegistryService>(StepRegistryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns true from isGoalFinished when ctx.done is set', () => {
    const ctx = createContext({ done: true });
    expect(service.isGoalFinished(ctx)).toBe(true);
  });

  it('returns true from isGoalFinished when all steps are done', () => {
    const ctx = createContext({
      steps: new Map<StepId, StepState>([['interpret', { status: 'done' }]]),
    });
    expect(service.isGoalFinished(ctx)).toBe(true);
  });

  it('returns false from isGoalFinished when a step is not done', () => {
    const ctx = createContext();
    expect(service.isGoalFinished(ctx)).toBe(false);
  });

  it('selects the next idle step with satisfied dependencies', () => {
    const ctx = createContext();
    registryService.addStep('interpret', { execute: vi.fn() });
    expect(service.selectNextStep(ctx, registryService.registry)).toBe(
      'interpret',
    );
  });

  it('returns undefined when no idle step is runnable', () => {
    const ctx = createContext({
      steps: new Map<StepId, StepState>([['interpret', { status: 'done' }]]),
    });
    registryService.addStep('interpret', { execute: vi.fn() });
    expect(
      service.selectNextStep(ctx, registryService.registry),
    ).toBeUndefined();
  });

  it('runs a step to completion', async () => {
    const execute = vi.fn();
    const ctx = createContext();
    registryService.addStep('interpret', { execute } satisfies StepHandler);

    await service.run(ctx);

    expect(execute).toHaveBeenCalledWith(ctx);
    expect(ctx.steps.get('interpret')).toEqual({ status: 'done' });
    expect(ctx.done).toBe(false);
  });

  it('marks context as error when a step throws', async () => {
    const execute = vi.fn().mockRejectedValue(new Error('step failed'));
    const ctx = createContext();
    registryService.addStep('interpret', { execute } satisfies StepHandler);

    await service.run(ctx);

    expect(ctx.steps.get('interpret')).toEqual({
      status: 'error',
      error: 'step failed',
    });
    expect(ctx.done).toBe(true);
    expect(ctx.doneReason).toBe('error');
    expect(ctx.error).toBe('step failed');
  });
});
