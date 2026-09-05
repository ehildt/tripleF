import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import type { MemoryRole } from '../../qdrant/models/memory.model.js';

/**
 * Everything except the vector is optional and only tightens the search.
 */
export class MemorySearchVectorDto {
  @ApiProperty({
    type: [Number],
    description: 'Query vector (must match the collection embedding size).',
    example: [0.1, 0.2, 0.3],
  })
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  vector!: number[];

  @ApiPropertyOptional({
    description:
      "Restrict to one memory partition (the user-set partition id or a session id) — the user's fact space.",
    example: 'default',
  })
  @IsString()
  @IsOptional()
  memoryPartition?: string;

  @ApiPropertyOptional({
    description: 'Restrict to one partition session.',
    example: 'sess-1234',
  })
  @IsString()
  @IsOptional()
  sessionId?: string;

  @ApiPropertyOptional({
    type: Number,
    default: 5,
    maximum: 5,
    description: 'Maximum number of results (capped at 5).',
  })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    enum: ['user', 'assistant'],
    description: 'Restrict to one turn side.',
  })
  @IsIn(['user', 'assistant'])
  @IsOptional()
  role?: MemoryRole;

  @ApiPropertyOptional({
    description: 'Restrict to one conversation.',
    example: 'conv-1234',
  })
  @IsString()
  @IsOptional()
  conversationId?: string;

  @ApiPropertyOptional({
    description: 'Restrict to records created by a specific request/turn.',
    example: 'req-1234',
  })
  @IsString()
  @IsOptional()
  requestId?: string;

  @ApiPropertyOptional({
    type: [String],
    maxItems: 8,
    description:
      'Topic labels: only records whose tags include ANY of these match.',
    example: ['work', 'rust'],
  })
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Full-text containment on the record text.',
    example: 'phone number',
  })
  @IsString()
  @IsOptional()
  contains?: string;
}
