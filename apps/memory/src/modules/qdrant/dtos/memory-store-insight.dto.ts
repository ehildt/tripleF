import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class MemoryStoreInsightDto {
  @ApiProperty({
    description: "The AI's cognition space key the insight belongs to.",
    example: 'default',
  })
  @IsString()
  memoryCognition!: string;

  @ApiProperty({
    description:
      'The derived insight to store, as one self-contained third-person sentence.',
    example: 'The user prefers single-line if statements.',
  })
  @IsString()
  @MaxLength(2000)
  text!: string;

  @ApiPropertyOptional({
    description:
      'Optional profile facet this insight deepens, e.g. "likes.cars".',
    example: 'preferences.code',
  })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  path?: string;

  @ApiPropertyOptional({
    description: 'Origin session id.',
    example: 'sess-1234',
  })
  @IsString()
  @IsOptional()
  sessionId?: string;

  @ApiPropertyOptional({
    description: 'Origin conversation id.',
    example: 'conv-1234',
  })
  @IsString()
  @IsOptional()
  conversationId?: string;

  @ApiPropertyOptional({
    description: 'Origin request id.',
    example: 'req-1234',
  })
  @IsString()
  @IsOptional()
  requestId?: string;
}
