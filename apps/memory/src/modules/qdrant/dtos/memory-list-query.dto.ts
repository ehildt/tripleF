import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import type { MemoryRole } from '../models/memory.model.js';

/** `?tags=a,b` (query-string arrays) → string[] for the keyword filter. */
const parseTags = ({ value }: { value: unknown }): string[] | undefined => {
  if (Array.isArray(value))
    return value.filter((t): t is string => typeof t === 'string');
  if (typeof value === 'string' && value.length > 0) {
    return value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return undefined;
};

/** All params are optional tightenings on top of the full memory listing. */
export class MemoryListQueryDto {
  @ApiPropertyOptional({
    description:
      "Restrict to one memory partition (the user-set partition id or a session id) — the user's fact space.",
    example: 'default',
  })
  @IsString()
  @IsOptional()
  memoryPartition?: string;

  @ApiPropertyOptional({
    description:
      "Restrict to one cognition key — the AI's understanding-of-the-user space (returns the living cognition document).",
    example: 'default',
  })
  @IsString()
  @IsOptional()
  memoryCognition?: string;

  @ApiPropertyOptional({
    description: 'Restrict to one partition session.',
    example: 'sess-1234',
  })
  @IsString()
  @IsOptional()
  sessionId?: string;

  @ApiPropertyOptional({
    enum: ['user', 'assistant'],
    description:
      'Restrict to one turn side (user message vs assistant response).',
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
    description:
      'Topic labels (comma-separated): only records whose tags include ANY of these match.',
    example: 'work,rust',
  })
  @Transform(parseTags)
  @IsArray()
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

  @ApiPropertyOptional({
    type: Number,
    default: 5000,
    maximum: 10000,
    description:
      'Maximum number of records (scroll page size, capped at 10000).',
  })
  @Transform(({ value }: { value: unknown }) =>
    value === undefined ? undefined : Number(value),
  )
  @IsInt()
  @Min(1)
  @Max(10000)
  @IsOptional()
  limit?: number;
}
