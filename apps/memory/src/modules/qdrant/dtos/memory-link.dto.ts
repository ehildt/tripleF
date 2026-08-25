import { ApiProperty } from '@nestjs/swagger';

/** One link edge between two memory points. */
export class MemoryLinkDto {
  @ApiProperty({
    description: 'Source point id.',
    example: '9f1c…',
  })
  source!: string;

  @ApiProperty({
    description: 'Target point id.',
    example: 'a3b2…',
  })
  target!: string;

  @ApiProperty({
    description: 'Cosine similarity between the two points.',
    example: 0.72,
  })
  score!: number;

  @ApiProperty({
    description:
      'Edge kind: `semantic` = enforced kNN link; `topical` = suggested link written by the relink job (recall ignores it).',
    example: 'semantic',
  })
  kind!: 'semantic' | 'topical';
}
