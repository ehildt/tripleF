import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * One lexicon chunk as returned by the list endpoint — one verbatim passage
 * of a fetched source document (the memory-lexicon collection, payload only).
 */
export class LexiconChunkDto {
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
}
