import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class WarmModelDto {
  @ApiProperty({
    description: 'The model name to warm up',
    example: 'llama3.2:3b',
  })
  @IsString()
  model!: string;
}

export class WarmModelResponseDto {
  @ApiProperty({
    description: 'Whether the warm-up was accepted',
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: 'The model that was warmed',
    example: 'llama3.2:3b',
  })
  model!: string;
}
