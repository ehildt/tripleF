import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** One friction record between two memory points. */
export class MemoryFrictionDto {
  @ApiProperty({
    description: 'Source point id (canonical undirected ordering).',
    example: '9f1c…',
  })
  source!: string;

  @ApiProperty({
    description: 'Target point id (canonical undirected ordering).',
    example: 'a3b2…',
  })
  target!: string;

  @ApiProperty({
    description:
      'Friction kind: contradiction | superseded | outdated | disagreement.',
    example: 'contradiction',
  })
  kind!: 'contradiction' | 'superseded' | 'outdated' | 'disagreement';

  @ApiProperty({
    description: 'Lifecycle state: open | resolved | dismissed.',
    example: 'open',
  })
  status!: 'open' | 'resolved' | 'dismissed';

  @ApiPropertyOptional({
    description: 'LLM-written description of the conflict.',
  })
  reason?: string;

  @ApiPropertyOptional({
    description: 'How the friction was resolved (which point won, why).',
  })
  resolution?: string;
}
