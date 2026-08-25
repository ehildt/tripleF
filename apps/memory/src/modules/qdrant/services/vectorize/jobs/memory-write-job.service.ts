import { Injectable, Logger } from '@nestjs/common';

import { OllamaConfigService } from '../../../../ai-sdk/configs/ollama-config.service.js';
import { AiSdkService } from '../../../../ai-sdk/services/ai-sdk.service.js';
import { createMemoryRememberTool } from '../../../../ai-sdk/tools/sources/memory/memory-remember.tool.js';
import {
  buildMemoryWritePrompt,
  MEMORY_WRITE_INSTRUCTIONS,
} from '../../../constants/memory-write-prompt.constant.js';
import type { MemoryWriteJobData } from '../../../models/memory.model.js';
import { MemorySearchService } from '../../memory-search.service.js';
import { VectorizeService } from '../../vectorize.service.js';

const PRIOR_MEMORY_LIMIT = 2000;

/**
 * Cognition-write job handler (vectorize queue): re-asks the model with the
 * turn's summarized tool results — from searches to facts, from facts to
 * memoryRemember decisions. Moved out of the harness so the write judgment
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
  ) {}

  async execute(data: MemoryWriteJobData): Promise<void> {
    const prior = await this.memorySearch.searchByText({
      memoryPartition: data.memoryPartition,
      sessionId: data.sessionId,
      text: data.userRequest,
      limit: 5,
    });
    const priorMemory = prior
      .map((p) => `- ${p.text}`)
      .join('\n')
      .slice(0, PRIOR_MEMORY_LIMIT);

    const rememberTool = createMemoryRememberTool({
      scope: {
        memoryPartition: data.memoryPartition,
        sessionId: data.sessionId ?? data.memoryPartition,
        conversationId: data.conversationId,
        requestId: data.requestId,
      },
      storeRecord: (input) => this.vectorizeService.storeRecord(input),
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
          }),
        },
      ],
      tools: { memoryRemember: rememberTool } as any,
      toolChoice: 'auto',
      keepAlive: this.ollamaConfigService.config.keepAlive,
      numCtx: data.numCtx,
      think: data.think,
    });

    const stored = result.toolResults.filter(
      (r) => r.toolName === 'memoryRemember',
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
