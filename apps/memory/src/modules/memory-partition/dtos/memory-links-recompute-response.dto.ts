import { ApiProperty } from '@nestjs/swagger';

/** Result of a link-graph recompute: the scope's edges were purged and
 * rebuilt with the current link threshold. */
export class MemoryLinksRecomputeResponseDto {
  @ApiProperty({
    description:
      'Edges of the scope after the recompute (strongest-first cap applies on read).',
    example: 42,
  })
  edges!: number;
}
