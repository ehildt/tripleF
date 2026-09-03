import { Injectable, Logger } from '@nestjs/common';
import {
  buildMemoryWritePrompt,
  MEMORY_WRITE_INSTRUCTIONS,
} from '@triplef/agent/prompts';
import { createMemoryCognitionRememberTool } from '@triplef/agent/tools';
import { createMemoryPartitionRememberTool } from '@triplef/agent/tools';
import { AiSdkService } from '@triplef/ai-sdk';

import { OllamaConfigService } from '../../../../ollama/configs/ollama-config.service.js';
import { buildProviderOptions } from '../../../../ollama/helpers/provider-options.helper.js';
import type { MemoryWriteJobData } from '../../../models/memory.model.js';
import { MemoryRepository } from '../../memory.repository.js';
import { MemoryCognitionService } from '../../memory-cognition.service.js';
import { MemorySearchService } from '../../memory-search.service.js';
import { VectorizeService } from '../../vectorize.service.js';

/**
 * Memory-write job handler (vectorize queue): re-asks the model with the
 * turn's summarized tool results — from searches to facts, from facts to
 * remember decisions. The model routes each durable item into the correct
 * lane: stated facts via memory-partition-remember, derived understanding via
 * memory-cognition-remember. Moved out of the harness so the write judgment
 * never extends a turn's duration: the harness step only enqueues.
 *
 * toolChoice is 'auto': a turn that surfaced nothing durable is a correct
 * empty outcome, never a failure. LLM/Qdrant errors propagate to BullMQ —
 * a memory write is never silently dropped.
 */
@Injectable()
export class MemoryWriteJobService {
  private readonly logger = new Logger(MemoryWriteJobService.name);

  constructor(
    private readonly aiSdkService: AiSdkService,
    private readonly ollamaConfigService: OllamaConfigService,
    private readonly memorySearch: MemorySearchService,
    private readonly vectorizeService: VectorizeService,
    private readonly memoryCognition: MemoryCognitionService,
    private readonly memoryRepository: MemoryRepository,
  ) {}

  async execute(data: MemoryWriteJobData): Promise<void> {
    const prior = await this.memorySearch.searchByText({
      memoryPartition: data.memoryPartition,
      sessionId: data.sessionId,
      text: data.userRequest,
      limit: 5,
    });
    const priorMemory = prior.map((p) => `- ${p.text}`).join('\n');

    // The partition's existing category/tag vocabulary — a reuse-first hint
    // so the model extends the taxonomy instead of minting near-duplicates.
    const [categories, tags] = await Promise.all([
      this.memoryRepository.facetCategories(data.memoryPartition),
      this.memoryRepository.facetTags(data.memoryPartition),
    ]);

    const scope = {
      memoryPartition: data.memoryPartition,
      memoryCognition: data.memoryCognition ?? data.memoryPartition,
      sessionId: data.sessionId ?? data.memoryPartition,
      conversationId: data.conversationId,
      requestId: data.requestId,
    };

    const partitionRememberTool = createMemoryPartitionRememberTool({
      scope,
      storeRecord: (input) => this.vectorizeService.storeRecord(input),
    });
    const cognitionRememberTool = createMemoryCognitionRememberTool({
      scope,
      storeInsight: (input) =>
        this.memoryCognition.storeInsight(
          {
            memoryCognition: input.memoryCognition,
            sessionId: input.sessionId,
            conversationId: input.conversationId,
            requestId: input.requestId,
          },
          { text: input.text, path: input.path },
        ),
    });

    const result = await this.aiSdkService.generateWithTools({
      model: data.model,
      messages: [
        { role: 'system', content: MEMORY_WRITE_INSTRUCTIONS },
        {
          role: 'user',
          content: buildMemoryWritePrompt({
            userRequest: data.userRequest,
            priorMemory,
            probedMemory: data.probedMemory,
            gathered: data.gathered,
            knownCategories: categories.map((entry) => entry.value),
            knownTags: tags.map((entry) => entry.value),
          }),
        },
      ],
      tools: {
        'memory-partition-remember': partitionRememberTool,
        'memory-cognition-remember': cognitionRememberTool,
      } as any,
      toolChoice: 'auto',
      providerOptions: buildProviderOptions({
        keepAlive: this.ollamaConfigService.config.keepAlive,
        numCtx: data.numCtx,
        think: data.think,
      }),
    });

    const stored = result.toolResults.filter(
      (r) =>
        r.toolName === 'memory-partition-remember' ||
        r.toolName === 'memory-cognition-remember',
    );
    if (stored.length > 0) {
      this.logger.log(
        {
          requestId: data.requestId,
          memoryPartition: data.memoryPartition,
          storedCount: stored.length,
        },
        `memory-write stored ${stored.length} record(s)`,
      );
      return;
    }
    this.logger.debug(
      { requestId: data.requestId, memoryPartition: data.memoryPartition },
      'memory-write: nothing durable stored',
    );
  }
}
