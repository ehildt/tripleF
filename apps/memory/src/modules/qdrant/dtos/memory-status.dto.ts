import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MemoryStatusResponseDto {
  @ApiProperty({
    description: 'Whether the memory feature is enabled (MEMORY_ENABLED).',
    example: true,
  })
  enabled!: boolean;

  @ApiProperty({
    description: 'Configured collection name.',
    example: 'harness_memory',
  })
  collection!: string;

  @ApiProperty({
    description:
      'Resolved collection name — the configured base namespaced by the embedding model.',
    example: 'harness_memory_nomic-embed-text-v2-moe',
  })
  resolvedCollection!: string;

  @ApiProperty({
    description: 'Embedding model used by the vectorize pipeline.',
    example: 'nomic-embed-text-v2-moe',
  })
  embedModel!: string;

  @ApiPropertyOptional({
    description:
      'Whether the embedding model is pulled on the Ollama host (false → every memory write/read silently degrades).',
    example: true,
  })
  embedModelAvailable?: boolean;

  @ApiProperty({
    description:
      'Configured fallback vector size (used when the model probe fails).',
    example: 768,
  })
  vectorSize!: number;

  @ApiPropertyOptional({
    description:
      'Vector size actually stored by the collection, when it exists.',
    example: 768,
  })
  collectionVectorSize?: number;

  @ApiProperty({
    description:
      'Whether the collection exists in Qdrant (false when disabled).',
    example: true,
  })
  exists!: boolean;

  @ApiProperty({
    description: 'Approximate point count in the collection.',
    example: 42,
  })
  pointsCount!: number;

  @ApiProperty({
    description: 'Payload keyword indexes present on the collection.',
    example: ['tier', 'session_id', 'conversation_id', 'user_id'],
  })
  indexes!: string[];
}
