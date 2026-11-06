import { Injectable, Logger } from '@nestjs/common';
import type {
  EncyclopediaSearchResult,
  EncyclopediaSourceDocument,
} from '@triplef/agent/schemas';
import { limitText } from '@triplef/helpers/limit-text';

import { MemoryEncyclopediaService } from '../../../memory-client/services/memory-encyclopedia.service.js';
import { mapChunkToEncyclopediaPassage } from '../../actions/helpers/map-chunk-to-encyclopedia-passage.helper.js';
import { mapChunkToReference } from '../../actions/helpers/map-chunk-to-reference.helper.js';
import {
  deriveBudgetChars,
  deriveReferenceDocChars,
} from '../../configs/source-budget-config.adapter.js';
import { SourceBudgetConfigService } from '../../configs/source-budget-config.service.js';
import type { HarnessContext } from '../harness-context.type.js';

import type { SanitizeReferenceSelectionResult } from './reference-selection.service.types.js';

/** Selects budget-bounded source references for the sanitize pipeline. */
@Injectable()
export class SanitizeReferenceSelectionService {
  private readonly logger = new Logger(SanitizeReferenceSelectionService.name);

  constructor(
    private readonly memoryEncyclopedia: MemoryEncyclopediaService,
    private readonly sourceBudget: SourceBudgetConfigService,
  ) {}

  /**
   * Normalize and ceiling-cap non-search tool results, then ask the memory
   * app's encyclopedia/select endpoint for the most relevant verbatim
   * passages. Selection outages fall back to the normalized references.
   */
  async selectReferences(
    ctx: HarnessContext,
    references: Array<Record<string, unknown>>,
    searchResults: EncyclopediaSearchResult[],
  ): Promise<SanitizeReferenceSelectionResult> {
    const numCtx = ctx.request.options?.num_ctx;
    const cfg = this.sourceBudget.config;
    const docChars = deriveReferenceDocChars(numCtx, cfg);

    const documents: EncyclopediaSourceDocument[] = [];
    const normalized: Array<Record<string, unknown>> = [];
    for (const ref of references) {
      const content = ref.content ?? ref.text ?? ref.snippet;
      if (typeof content !== 'string' || !content.trim()) {
        normalized.push(ref);
        continue;
      }
      const capped = limitText(content, docChars);
      documents.push({
        url: typeof ref.url === 'string' ? ref.url : undefined,
        title: typeof ref.title === 'string' ? ref.title : undefined,
        content: capped,
      });
      normalized.push({ ...ref, content: capped });
    }

    const query =
      ctx.outputs.intent?.contextSummary?.trim() ||
      ctx.lastUserPrompt?.trim() ||
      '';
    if (!query) return { references: normalized };

    // Offer search results even when no fetched documents exist — the ingest
    // triage persists the on-topic ones as snippet points.
    if (documents.length === 0 && searchResults.length === 0) {
      return { references: normalized };
    }

    const selection = await this.memoryEncyclopedia.selectContext({
      query,
      documents,
      searchResults,
      budgetChars: deriveBudgetChars(numCtx, cfg),
      partitionScope: ctx.memoryPartition ?? ctx.sessionId ?? 'global',
      model: ctx.model,
    });
    if (!selection) {
      this.logger.warn(
        { requestId: ctx.requestId, step: 'sanitize' },
        'reference selection unavailable — falling back to full references',
      );
      return { references: normalized };
    }

    this.logger.log(
      {
        requestId: ctx.requestId,
        step: 'sanitize',
        consideredChunks: selection.consideredChunks,
        selectedChunks: selection.selectedChunks,
      },
      'reference selection applied',
    );
    return {
      references: selection.chunks.map(mapChunkToReference),
      selection: {
        considered: selection.consideredChunks,
        selected: selection.selectedChunks,
      },
      encyclopediaPassages: selection.pastChunks?.map(
        mapChunkToEncyclopediaPassage,
      ),
    };
  }
}
