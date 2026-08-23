import { Injectable } from '@nestjs/common';

import { StepId } from './harness-context.type.js';
import { StepHandler } from './harness-step.interface.js';

export type StepRegistry = Map<
  StepId,
  { handler: StepHandler; deps: StepId[] }
>;

@Injectable()
export class StepRegistryService {
  private readonly _registry: StepRegistry = new Map();

  addStep(id: StepId, handler: StepHandler, deps: StepId[] = []): this {
    this._registry.set(id, { handler, deps });
    return this;
  }

  removeStep(id: StepId): this {
    this._registry.delete(id);
    return this;
  }

  get registry(): StepRegistry {
    return this._registry;
  }

  clear(): this {
    this._registry.clear();
    return this;
  }
}
