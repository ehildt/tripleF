import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { StepHandler } from './harness-step.interface.js';
import { StepRegistryService } from './step-registry.service.js';

describe('StepRegistryService', () => {
  let service: StepRegistryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StepRegistryService],
    }).compile();

    service = module.get<StepRegistryService>(StepRegistryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('adds a step without dependencies', () => {
    const handler: StepHandler = { execute: vi.fn() };

    service.addStep('interpret', handler);

    const registry = service.registry;
    expect(registry.get('interpret')).toEqual({ handler, deps: [] });
  });

  it('adds a step with dependencies', () => {
    const handler: StepHandler = { execute: vi.fn() };

    service.addStep('respond', handler, ['interpret']);

    const registry = service.registry;
    expect(registry.get('respond')).toEqual({ handler, deps: ['interpret'] });
  });

  it('returns this from addStep for chaining', () => {
    const handler: StepHandler = { execute: vi.fn() };

    expect(service.addStep('interpret', handler)).toBe(service);
  });

  it('removes a step', () => {
    const handler: StepHandler = { execute: vi.fn() };
    service.addStep('interpret', handler);

    service.removeStep('interpret');

    expect(service.registry.has('interpret')).toBe(false);
  });

  it('returns this from removeStep for chaining', () => {
    expect(service.removeStep('interpret')).toBe(service);
  });

  it('clears all steps', () => {
    const handler: StepHandler = { execute: vi.fn() };
    service.addStep('interpret', handler).addStep('respond', handler);

    service.clear();

    expect(service.registry.size).toBe(0);
  });

  it('returns this from clear for chaining', () => {
    expect(service.clear()).toBe(service);
  });
});
