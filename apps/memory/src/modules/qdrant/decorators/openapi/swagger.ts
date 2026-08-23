import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { MemoryCognitionSnapshotDto } from '../../dtos/memory-cognition-snapshot.dto.js';
import { MemoryDeleteResponseDto } from '../../dtos/memory-delete-response.dto.js';
import { MemoryItemDto } from '../../dtos/memory-item.dto.js';
import { MemoryPruneResponseDto } from '../../dtos/memory-prune-response.dto.js';
import { QdrantStatusResponseDto } from '../../dtos/qdrant-status.dto.js';

export const ApeTagsQdrant = () => ApiTags('Qdrant');

export const ApeGetQdrantStatus = () =>
  applyDecorators(
    ApiResponse({ status: 200, type: QdrantStatusResponseDto }),
    ApiOperation({
      summary: 'Qdrant collection status (feature flag, existence, indexes)',
    }),
  );

export const ApeGetQdrantMemoryCognition = () =>
  applyDecorators(
    ApiResponse({ status: 200, type: MemoryCognitionSnapshotDto }),
    ApiOperation({
      summary:
        'The AI cognition snapshot of one space: the structured profile document (Postgres) plus derived insights (Qdrant)',
    }),
  );

export const ApeGetQdrantMemory = () =>
  applyDecorators(
    ApiResponse({ status: 200, type: [MemoryItemDto] }),
    ApiOperation({
      summary: 'List memory records; all params are optional tightenings',
    }),
  );

export const ApePostQdrantText = () =>
  applyDecorators(
    ApiResponse({
      status: 200,
      description:
        'accepted:true with the stored point id; accepted:false when the feature is disabled or the store failed.',
    }),
    ApiOperation({
      summary: 'Store a text verbatim as one memory record (sync)',
    }),
  );

export const ApeDeleteQdrantText = () =>
  applyDecorators(
    ApiResponse({ status: 200, type: MemoryDeleteResponseDto }),
    ApiOperation({
      summary:
        "Delete memory records by filters, or the AI's cognition document (cognition=true)",
    }),
  );

export const ApePostQdrantSearchText = () =>
  applyDecorators(
    ApiResponse({ status: 200, type: [MemoryItemDto] }),
    ApiOperation({
      summary: 'Search memory by text (embeds the query, then searches)',
    }),
  );

export const ApePostQdrantSearchVector = () =>
  applyDecorators(
    ApiResponse({ status: 200, type: [MemoryItemDto] }),
    ApiOperation({ summary: 'Search memory by a raw query vector' }),
  );

export const ApeDeleteQdrantMemory = () =>
  applyDecorators(
    ApiResponse({ status: 200, type: MemoryPruneResponseDto }),
    ApiOperation({
      summary:
        'Prune the caller partition: its fact records only (or one conversation of it) — the AI cognition lane has its own wipe endpoint',
    }),
  );

export const ApeTagsMemoryOverrides = () => ApiTags('Memory Overrides');

export const ApeGetMemoryOverrides = () =>
  ApiOperation({
    summary:
      'Current memory system variables (sysctl → system): effective value, env baseline, override flag',
  });

export const ApePutMemoryOverrides = () =>
  ApiOperation({
    summary:
      'Update memory system variables — takes effect on the very next request',
  });

export const ApeDeleteMemoryOverrides = () =>
  ApiOperation({ summary: 'Reset memory system variables to env defaults' });
