import { ApiProperty } from '@nestjs/swagger';

/**
 * One cluster-synopsis hit — the Raptor layer's probe record: a community
 * summary over a cluster of related records (level 0) or over other
 * synopses (level 1+, higher = broader).
 */
export class MemorySynopsisDto {
  @ApiProperty({
    description: 'Id of the cluster this synopsis summarizes.',
    example: '9f1c…',
  })
  clusterId!: string;

  @ApiProperty({
    description: "Space key: the partition key, or 'global' (encyclopedia).",
    example: 'default',
  })
  scopeKey!: string;

  @ApiProperty({
    description:
      'Hierarchy level (0 = leaf cluster; 1+ = cluster of synopses).',
    example: 0,
  })
  level!: number;

  @ApiProperty({
    description: 'LLM-written short noun-phrase label (2–6 words).',
    example: 'gaming preferences',
  })
  title!: string;

  @ApiProperty({
    description: 'LLM-written one/two-sentence community summary.',
    example:
      'The user plays several gacha games and tracks their pulls and events.',
  })
  summary!: string;

  @ApiProperty({
    description: 'Direct members of the summarized cluster.',
    example: 12,
  })
  memberCount!: number;

  @ApiProperty({
    description: 'Cosine similarity to the query.',
    example: 0.77,
  })
  score?: number;
}
