import { Injectable } from '@nestjs/common';
import {
  buildFrictionPrompt,
  FRICTION_INSTRUCTIONS,
  type FrictionFact,
} from '@triplef/agent/prompts';
import { AiSdkService } from '@triplef/ai-sdk';

import { OllamaConfigService } from '../../ai-sdk/configs/ollama-config.service.js';
import { buildProviderOptions } from '../../ai-sdk/helpers/provider-options.helper.js';
import type { FrictionVerdict } from '../helpers/friction-verdict.schema.js';
import { parseFrictionVerdict } from '../helpers/parse-friction-verdict.helper.js';

/**
 * LLM adjudication for the reflection pass's friction screen: one chat call
 * per record against its near-neighbor candidates, verdict {contradicts,
 * conflictingId, winnerId, reason}. Contradiction is semantic (negation /
 * polarity flip / superseding update) — cosine thresholds cannot see it, so
 * it is LLM-judged only. Returns undefined when the answer is unusable so the
 * reflect job can defer the point to a later run.
 */
@Injectable()
export class FrictionAdjudicatorService {
  constructor(
    private readonly aiSdkService: AiSdkService,
    private readonly ollamaConfigService: OllamaConfigService,
  ) {}

  async adjudicate(
    model: string,
    record: FrictionFact,
    candidates: FrictionFact[],
  ): Promise<FrictionVerdict | undefined> {
    const { text } = await this.aiSdkService.generateChat({
      model,
      messages: [
        { role: 'system', content: FRICTION_INSTRUCTIONS },
        {
          role: 'user',
          content: buildFrictionPrompt({ record, candidates }),
        },
      ],
      providerOptions: buildProviderOptions({
        think: false,
        keepAlive: this.ollamaConfigService.config.keepAlive,
      }),
      tools: {},
    });
    return parseFrictionVerdict(text);
  }
}
