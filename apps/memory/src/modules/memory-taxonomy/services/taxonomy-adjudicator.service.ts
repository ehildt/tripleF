import { Injectable } from '@nestjs/common';
import { buildTaxonomyReconcileSystemPrompt } from '@triplef/agent/prompts';
import { buildTaxonomyPairPrompt } from '@triplef/agent/prompts';
import {
  type TaxonomyPairVerdict,
  TaxonomyPairVerdictSchema,
} from '@triplef/agent/schemas';
import { AiSdkService } from '@triplef/ai-sdk';
import { parseLlmJson } from '@triplef/helpers/parse-llm-json';

import { OllamaConfigService } from '../../ollama/configs/ollama-config.service.js';
import { buildProviderOptions } from '../../ollama/helpers/provider-options.helper.js';
import type { MemoryTaxonomyKind } from '../../persistence/constants/memory-taxonomy.constant.js';

/** One candidate pair under adjudication. */
export interface TaxonomyPair {
  kind: MemoryTaxonomyKind;
  labelA: string;
  labelB: string;
  countA: number;
  countB: number;
}

/**
 * LLM adjudication for the taxonomy reconciliation sweep: one chat call per
 * ambiguous-band pair, verdict {same, distinct} under the reconciliation
 * instructions (precision-first — "when in doubt: distinct"). Mirrors the
 * consolidation adjudicator's contract: tolerant parse, undefined when the
 * answer is unusable so the pair defers to the next run.
 */
@Injectable()
export class TaxonomyAdjudicatorService {
  constructor(
    private readonly aiSdkService: AiSdkService,
    private readonly ollamaConfigService: OllamaConfigService,
  ) {}

  async adjudicate(
    model: string,
    pair: TaxonomyPair,
  ): Promise<TaxonomyPairVerdict | undefined> {
    const { text } = await this.aiSdkService.generateChat({
      model,
      messages: [
        { role: 'system', content: buildTaxonomyReconcileSystemPrompt() },
        { role: 'user', content: buildTaxonomyPairPrompt(pair) },
      ],
      providerOptions: buildProviderOptions({
        think: false,
        keepAlive: this.ollamaConfigService.config.keepAlive,
      }),
      tools: {},
    });
    if (!text?.trim()) return undefined;
    try {
      const parsed = TaxonomyPairVerdictSchema.safeParse(parseLlmJson(text));
      return parsed.success ? parsed.data : undefined;
    } catch {
      return undefined;
    }
  }
}
