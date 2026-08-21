import { ApiProperty } from '@nestjs/swagger';

export class MemoryPruneResponseDto {
  @ApiProperty({
    description: 'Number of memory points deleted for the partition.',
    example: 12,
  })
  deleted!: number;
}
