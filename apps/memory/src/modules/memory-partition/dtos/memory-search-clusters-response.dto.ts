import { ApiProperty } from '@nestjs/swagger';

import { MemoryItemDto } from '../../qdrant/dtos/memory-item.dto.js';

import { MemoryClusterDto } from './memory-cluster.dto.js';

/** Graph-augmented search result: the kNN hits plus their cluster summaries. */
export class MemorySearchClustersResponseDto {
  @ApiProperty({
    type: [MemoryItemDto],
    description: 'The semantic search hits (fact records).',
  })
  points!: MemoryItemDto[];

  @ApiProperty({
    type: [MemoryClusterDto],
    description:
      'The detected clusters the hits belong to (title + summary each).',
  })
  clusters!: MemoryClusterDto[];
}
