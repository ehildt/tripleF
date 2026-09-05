import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** One detected cluster — a cluster of related memory points with its LLM summary. */
export class MemoryClusterDto {
  @ApiProperty({
    description:
      'Deterministic cluster id (the cluster_id payload on members).',
    example: '9f1c…',
  })
  id!: string;

  @ApiProperty({
    description: "Lane the cluster belongs to ('partition' | 'encyclopedia').",
    example: 'partition',
  })
  lane!: string;

  @ApiProperty({
    description: "Space key: the partition key, or 'global' (encyclopedia).",
    example: 'default',
  })
  scopeKey!: string;

  @ApiProperty({
    description: 'Hash of the sorted member ids — the membership-drift signal.',
    example: 'a3b2…',
  })
  fingerprint!: string;

  @ApiProperty({
    description: 'LLM-written short noun-phrase label (2–6 words).',
    example: 'gaming preferences',
  })
  title!: string;

  @ApiProperty({
    description: 'LLM-written one/two-sentence summary of the cluster.',
    example:
      'The user plays several gacha games and tracks their pulls and events.',
  })
  summary!: string;

  @ApiProperty({
    description: 'Number of member points.',
    example: 12,
  })
  memberCount!: number;

  @ApiProperty({
    description: 'The member point ids (authoritative membership list).',
    example: ['9f1c…', 'a3b2…'],
  })
  memberIds!: string[];

  @ApiProperty({
    description:
      'Hierarchy level (Raptor): 0 = leaf cluster over points; 1+ = cluster of cluster synopses (members are child cluster ids).',
    example: 0,
  })
  level!: number;

  @ApiPropertyOptional({
    description: 'Parent cluster id at level+1 (absent on the top level).',
    example: '9f1c…',
  })
  parentId?: string;
}
