import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { MemoryClusterDto } from '../../../qdrant/dtos/memory-cluster.dto.js';
import { MemoryClusterResponseDto } from '../../../qdrant/dtos/memory-cluster-response.dto.js';
import { MemoryFrictionDto } from '../../../qdrant/dtos/memory-friction.dto.js';
import { MemoryLinkDto } from '../../../qdrant/dtos/memory-link.dto.js';
import { MemoryLinksRecomputeResponseDto } from '../../../qdrant/dtos/memory-links-recompute-response.dto.js';
import { MemoryReflectResponseDto } from '../../../qdrant/dtos/memory-reflect-response.dto.js';
import { EncyclopediaChunkDto } from '../../dtos/encyclopedia-chunk.dto.js';

export const ApeTagsEncyclopedia = () => ApiTags('Encyclopedia');

export const ApeTagsEncyclopediaMaintenance = () =>
  ApiTags('Encyclopedia Maintenance');

export const ApeGetEncyclopedia = () =>
  applyDecorators(
    ApiResponse({ status: 200, type: [EncyclopediaChunkDto] }),
    ApiOperation({
      summary:
        'List encyclopedia chunks (payload only); all params are optional tightenings',
    }),
  );

export const ApeGetEncyclopediaLinks = () =>
  applyDecorators(
    ApiResponse({ status: 200, type: [MemoryLinkDto] }),
    ApiOperation({
      summary:
        'Semantic kNN link graph of the encyclopedia (cosine neighbors above the link threshold)',
    }),
  );

export const ApeGetEncyclopediaFrictions = () =>
  applyDecorators(
    ApiResponse({ status: 200, type: [MemoryFrictionDto] }),
    ApiOperation({
      summary:
        'Friction records of the encyclopedia (contradictions/conflicts written by the reflection pass)',
    }),
  );

export const ApeGetEncyclopediaClusters = () =>
  applyDecorators(
    ApiResponse({ status: 200, type: [MemoryClusterDto] }),
    ApiOperation({
      summary:
        'Detected clusters of the encyclopedia (clusters of related chunks with LLM-written title + summary)',
    }),
  );

export const ApePostEncyclopediaLinksRecompute = () =>
  applyDecorators(
    ApiResponse({ status: 200, type: MemoryLinksRecomputeResponseDto }),
    ApiOperation({
      summary:
        'Recompute the encyclopedia link graph with the current link threshold (purge + bounded backfill — the migration path after raising MEMORY_LINK_SCORE_THRESHOLD)',
    }),
  );

export const ApePostEncyclopediaSelect = () =>
  applyDecorators(
    ApiResponse({
      status: 200,
      description:
        'Ranked verbatim passages selected under the budget, plus neighbor-expanded past-research passages and selection stats. Documents with a url are persisted (read-through cache) unless persistence is disabled.',
    }),
    ApiResponse({
      status: 503,
      description:
        'Encyclopedia selection is disabled or the embed call failed.',
    }),
    ApiOperation({
      summary:
        'Select the most relevant verbatim passages from fetched source documents, persisting url-keyed documents into the shared memory-encyclopedia index',
    }),
  );

export const ApePostEncyclopediaIndex = () =>
  applyDecorators(
    ApiResponse({
      status: 200,
      description:
        'Documents indexed into the shared encyclopedia (url-keyed, idempotent by content hash). Returns stored/reused counts plus any rejected (oversized or empty) uploads.',
    }),
    ApiOperation({
      summary:
        'Index uploaded documents into the shared memory-encyclopedia collection (persist-only, no selection)',
    }),
  );
export const ApePostEncyclopediaConsolidate = () =>
  applyDecorators(
    ApiResponse({
      status: 200,
      description:
        'Supersede sweep enqueued (deterministic — heals orphaned old-hash chunks).',
    }),
    ApiOperation({
      summary:
        '① Consolidate — 1st step of the encyclopedia maintenance pipeline: deterministic supersede sweep over pending ledger documents (heals orphaned old-hash chunks so only the current version remains)',
    }),
  );

export const ApePostEncyclopediaClassify = () =>
  applyDecorators(
    ApiResponse({
      status: 200,
      description:
        'Classification job enqueued (labels pending documents with category + topic).',
    }),
    ApiOperation({
      summary:
        '② Classify — 2nd step of the encyclopedia maintenance pipeline: label stored documents with the source-agnostic category + topic. Runs after the supersede sweep settles',
    }),
  );

export const ApePostEncyclopediaReflect = () =>
  applyDecorators(
    ApiResponse({ status: 200, type: MemoryReflectResponseDto }),
    ApiOperation({
      summary:
        '③ Reflect — 3rd step of the encyclopedia maintenance pipeline: screen unreflected chunks for contradictions, write friction records, supersede the loser when a winner is clear. Runs after classify settles',
    }),
  );

export const ApePostEncyclopediaCluster = () =>
  applyDecorators(
    ApiResponse({ status: 200, type: MemoryClusterResponseDto }),
    ApiOperation({
      summary:
        '④ Cluster detection — final step of the encyclopedia maintenance pipeline: cluster the link graph into clusters, absorb singletons (no lone facts), and summarize each changed cluster. Runs after the graph-mutating steps settle',
    }),
  );

export const ApePostEncyclopediaSearch = () =>
  applyDecorators(
    ApiResponse({
      status: 200,
      description:
        'Knowledge-base hits: verbatim chunks of persisted sources (fetched pages, uploaded documents) with url, chunk coordinates, fetch date, and score. Empty when nothing matched.',
    }),
    ApiOperation({
      summary:
        'Agentic semantic search over the whole encyclopedia, optionally scoped to one document url or domain — backs the encyclopedia-search tool',
    }),
  );

export const ApePostEncyclopediaDocument = () =>
  applyDecorators(
    ApiResponse({
      status: 200,
      description:
        'One verbatim window of the document (overlap-stripped, original order), with chunk coordinates and hasMore for continuation. Null when the url is unknown.',
    }),
    ApiOperation({
      summary:
        'Read one stored document windowed (offset + char budget) — the deep-dive read behind the encyclopedia-read tool',
    }),
  );
