import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

/**
 * Taxonomy tree read query: which lane's registry to list for a scope —
 * `partition` (the caller's fact partition) or `encyclopedia` (the global
 * scope, scopeKey is 'global'). Cognition is path-routed, taxonomy-free.
 */
export class MemoryTaxonomyQueryDto {
  @ApiProperty({
    enum: ['partition', 'encyclopedia'],
    description: 'Which lane’s taxonomy to list.',
    example: 'partition',
  })
  @IsIn(['partition', 'encyclopedia'])
  lane!: 'partition' | 'encyclopedia';

  @ApiProperty({
    description:
      "The scope key — the partition key for `partition`, 'global' for `encyclopedia`.",
    example: 'default',
  })
  @IsString()
  scopeKey!: string;
}
