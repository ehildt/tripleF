import { ApiProperty } from '@nestjs/swagger';

export class MemoryDeleteResponseDto {
  @ApiProperty({
    description: 'Number of memory points deleted (0 when nothing matched).',
    example: 1,
  })
  deleted!: number;

  @ApiProperty({
    type: [String],
    description:
      'Verbatim texts of the removed records — caller transparency about exactly what is gone. Empty when nothing matched.',
    example: ['I prefer single-line if statements.'],
  })
  texts!: string[];
}
