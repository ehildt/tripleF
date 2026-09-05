import { Injectable } from '@nestjs/common';

import type { VectorizeStepId } from './vectorize-context.type.js';
import type { VectorizeStepHandler } from './vectorize-step.interface.js';

export type VectorizeStepRegistry = Map<
  VectorizeStepId,
  { handler: VectorizeStepHandler; deps: VectorizeStepId[] }
>;

/** Registers pipeline steps with their dependencies — mirrors StepRegistryService. */
@Injectable()
export class VectorizeStepRegistryService {
  private readonly _registry: VectorizeStepRegistry = new Map();

  addStep(
    id: VectorizeStepId,
    handler: VectorizeStepHandler,
    deps: VectorizeStepId[] = [],
  ): this {
    this._registry.set(id, { handler, deps });
    return this;
  }

  get registry(): VectorizeStepRegistry {
    return this._registry;
  }

  clear(): void {
    this._registry.clear();
  }
}
