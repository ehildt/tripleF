import { ApiProperty } from '@nestjs/swagger';

export class EncyclopediaConsolidateResponseDto {
  @ApiProperty({
    description: 'Whether the sweep was enqueued.',
    example: true,
  })
  accepted!: boolean;

  @ApiProperty({
    description: 'Pending documents at enqueue time (0 = nothing to sweep).',
    example: 12,
  })
  pending!: number;
}
