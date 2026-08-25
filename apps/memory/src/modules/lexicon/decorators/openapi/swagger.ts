import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { MemoryLinkDto } from '../../../qdrant/dtos/memory-link.dto.js';
import { MemoryLinksRecomputeResponseDto } from '../../../qdrant/dtos/memory-links-recompute-response.dto.js';
import { LexiconChunkDto } from '../../dtos/lexicon-chunk.dto.js';

export const ApeTagsLexicon = () => ApiTags('Lexicon');

export const ApeGetLexicon = () =>
  applyDecorators(
    ApiResponse({ status: 200, type: [LexiconChunkDto] }),
    ApiOperation({
      summary:
        'List lexicon chunks (payload only); all params are optional tightenings',
    }),
  );

export const ApeGetLexiconLinks = () =>
  applyDecorators(
    ApiResponse({ status: 200, type: [MemoryLinkDto] }),
    ApiOperation({
      summary:
        'Semantic kNN link graph of the lexicon (cosine neighbors above the link threshold)',
    }),
  );

export const ApePostLexiconLinksRecompute = () =>
  applyDecorators(
    ApiResponse({ status: 200, type: MemoryLinksRecomputeResponseDto }),
    ApiOperation({
      summary:
        'Recompute the lexicon link graph with the current link threshold (purge + bounded backfill — the migration path after raising MEMORY_LINK_SCORE_THRESHOLD)',
    }),
  );

export const ApePostLexiconSelect = () =>
  applyDecorators(
    ApiResponse({
      status: 200,
      description:
        'Ranked verbatim passages selected under the budget, plus neighbor-expanded past-research passages and selection stats. Documents with a url are persisted (read-through cache) unless persistence is disabled.',
    }),
    ApiResponse({
      status: 503,
      description: 'Lexicon selection is disabled or the embed call failed.',
    }),
    ApiOperation({
      summary:
        'Select the most relevant verbatim passages from fetched source documents, persisting url-keyed documents into the shared memory-lexicon index',
    }),
  );

export const ApePostLexiconIndex = () =>
  applyDecorators(
    ApiResponse({
      status: 200,
      description:
        'Documents indexed into the shared lexicon (url-keyed, idempotent by content hash). Returns stored/reused counts.',
    }),
    ApiOperation({
      summary:
        'Index uploaded documents into the shared memory-lexicon collection (persist-only, no selection)',
    }),
  );

export const ApePostLexiconConsolidate = () =>
  applyDecorators(
    ApiResponse({
      status: 200,
      description:
        'Supersede sweep enqueued (deterministic — heals orphaned old-hash chunks).',
    }),
    ApiOperation({
      summary:
        'Trigger the lexicon supersede sweep over pending ledger documents',
    }),
  );
