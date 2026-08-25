import { Injectable } from '@nestjs/common';
import {
  buildConsolidatePrompt,
  MEMORY_CONSOLIDATE_INSTRUCTIONS,
} from '@triplef/agent/prompts';
import {
  type ConsolidationVerdict,
  ConsolidationVerdictSchema,
} from '@triplef/agent/schemas';
import { AiSdkService } from '@triplef/ai-sdk';
import { parseLlmJson } from '@triplef/helpers/parse-llm-json';

import { OllamaConfigService } from '../../ai-sdk/configs/ollama-config.service.js';
import { buildProviderOptions } from '../../ai-sdk/helpers/provider-options.helper.js';
import type { MemoryRole } from '../models/memory.model.js';

/** One provenance-labeled record line — the adjudication input. */
export interface AdjudicationFact {
  text: string;
  role: MemoryRole;
  createdAt: string;
}

/**
 * Shared LLM adjudication for the consolidation and relink jobs: one chat
 * call against the near-duplicate candidates, verdicts {keep, redundant,
 * merge} under the consolidation instructions. LLM-judged only — cosine
 * thresholds cannot see negation/polarity flips, so geometric merges are
 * never used. Returns undefined when the answer is unusable (garbage or
 * unparseable) so callers can defer the row/point to a later run.
 */
@Injectable()
export class ConsolidationAdjudicatorService {
  constructor(
    private readonly aiSdkService: AiSdkService,
    private readonly ollamaConfigService: OllamaConfigService,
  ) {}

  async adjudicate(
    model: string,
    newFact: AdjudicationFact,
    candidates: AdjudicationFact[],
  ): Promise<ConsolidationVerdict | undefined> {
    const { text } = await this.aiSdkService.generateChat({
      model,
      messages: [
        { role: 'system', content: MEMORY_CONSOLIDATE_INSTRUCTIONS },
        {
          role: 'user',
          content: buildConsolidatePrompt({ newFact, candidates }),
        },
      ],
      providerOptions: buildProviderOptions({
        think: false,
        keepAlive: this.ollamaConfigService.config.keepAlive,
      }),
      tools: {},
    });
    return this.parseVerdict(text);
  }

  /** Tolerant parse + schema validation; undefined when the answer is unusable. */
  private parseVerdict(
    text: string | undefined,
  ): ConsolidationVerdict | undefined {
    if (!text?.trim()) return undefined;
    try {
      const parsed = ConsolidationVerdictSchema.safeParse(parseLlmJson(text));
      return parsed.success ? parsed.data : undefined;
    } catch {
      return undefined;
    }
  }
}
