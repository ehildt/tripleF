import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * One encyclopedia chunk as returned by the list endpoint — one verbatim passage
 * of a fetched source document (the memory-encyclopedia collection, payload only).
 */
export class EncyclopediaChunkDto {
  @ApiProperty({
    description: 'Deterministic point id: url|contentHash|chunkIndex.',
    example: 'https://example.com/article|abc123|0',
  })
  id!: string;

  @ApiProperty({
    description: 'Verbatim chunk text.',
    example: 'The article body…',
  })
  content!: string;

  @ApiProperty({
    description: 'Source URL of the document.',
    example: 'https://example.com/article',
  })
  url!: string;

  @ApiProperty({
    description: 'Source domain.',
    example: 'example.com',
  })
  domain!: string;

  @ApiPropertyOptional({
    description: 'Source title.',
    example: 'Article title',
  })
  title?: string;

  @ApiProperty({
    description: 'ISO timestamp the document was fetched.',
    example: '2025-01-01T00:00:00.000Z',
  })
  fetchedAt!: string;

  @ApiProperty({
    description: 'Content hash of the full document (supersede identity).',
    example: 'abc123',
  })
  contentHash!: string;

  @ApiProperty({
    description: 'Zero-based chunk index within the document.',
    example: 0,
  })
  chunkIndex!: number;

  @ApiProperty({
    description: 'Total chunk count of the document.',
    example: 12,
  })
  chunkCount!: number;

  @ApiProperty({
    description: 'Partition that fetched the content (provenance only).',
    example: 'global',
  })
  partitionScope!: string;

  @ApiProperty({
    description:
      'Point kind: content = fetched-document chunk, result = search-result snippet.',
    example: 'content',
  })
  sourceType!: 'content' | 'result';

  @ApiPropertyOptional({
    description: 'Mime type of the original upload (uploaded documents only).',
    example: 'application/pdf',
  })
  mimeType?: string;

  @ApiPropertyOptional({
    description: 'Byte size of the original upload (uploaded documents only).',
    example: 245760,
  })
  sizeBytes?: number;

  @ApiPropertyOptional({
    description:
      'Content hash of the ORIGINAL upload — the MinIO object identity (uploaded documents only).',
    example: 'a3b2c1',
  })
  originalHash?: string;

  @ApiPropertyOptional({
    description:
      'Broad family label (e.g. games) — the constellation category tier (the cluster grouping fallback). Source-agnostic: files and web pages alike.',
    example: 'games',
  })
  category?: string;

  @ApiPropertyOptional({
    description:
      'Narrow topic label (e.g. wuthering waves) — the constellation topic tier.',
    example: 'wuthering waves',
  })
  topic?: string;

  @ApiPropertyOptional({
    description:
      'Plural sub-family one tier below the category (e.g. survival-games) — the constellation community tier.',
    example: 'survival-games',
  })
  community?: string;

  @ApiPropertyOptional({
    description:
      'Detected cluster id this chunk belongs to (written by the memory-cluster job; the cluster tier grouping key).',
    example: '9f1c…',
  })
  clusterId?: string;

  @ApiPropertyOptional({
    description: 'True once the supersede sweep adjudicated this chunk.',
  })
  isConsolidated?: boolean;

  @ApiPropertyOptional({
    description:
      'True once the chunk has at least one constellation link edge.',
  })
  isLinked?: boolean;

  @ApiPropertyOptional({
    description: 'True once the reflection pass reviewed this chunk.',
  })
  isReflected?: boolean;

  @ApiPropertyOptional({
    description: 'True while the chunk is involved in an open friction.',
  })
  isFriction?: boolean;

  @ApiPropertyOptional({
    description: 'True when a friction resolution marked this chunk stale.',
  })
  superseded?: boolean;

  @ApiPropertyOptional({
    description: 'Chunk id that superseded this one.',
  })
  supersededBy?: string;
}
