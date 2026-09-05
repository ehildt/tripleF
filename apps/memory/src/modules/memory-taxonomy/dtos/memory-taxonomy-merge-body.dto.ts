import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

/**
 * Taxonomy merge body: the source node (path id) folds into `into` — same
 * lane, scope and tier required. The winner's label propagates onto every
 * leaf payload; the loser's name and aliases become winner aliases forever.
 */
export class MemoryTaxonomyMergeBodyDto {
  @ApiProperty({
    description: 'The taxonomy node id the source merges INTO (the winner).',
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
  })
  @IsUUID()
  into!: string;
}
