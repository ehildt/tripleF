import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

  @ApiPropertyOptional({
    type: [String],
    description:
      'Profile topics pruned by a targeted cognition delete (the removed routing values/keys). Only set on the cognition path — absent for fact-record deletes.',
    example: ['jazz'],
  })
  pruned?: string[];
}
