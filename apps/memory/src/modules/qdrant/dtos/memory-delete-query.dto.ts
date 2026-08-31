import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

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

/**
 * Filtered record delete. The space is required (partition id, falling back
 * to the session id), plus at least one matcher — an unscoped
 * delete-nothing-matched call is rejected, mirroring the list endpoint's
 * tightening vocabulary. `cognition=true` wipes the AI's cognition document
 * instead of fact records and needs no further matcher.
 */
export class MemoryDeleteQueryDto {
  @ApiPropertyOptional({
    description:
      'Memory partition to delete from (the user-set partition id). Defaults to sessionId — one of the two is required.',
    example: 'default',
  })
  @IsString()
  @IsOptional()
  memoryPartition?: string;

  @ApiPropertyOptional({
    description:
      'Session scope — the fallback partition and an optional session tightening.',
    example: 'sess-1234',
  })
  @IsString()
  @IsOptional()
  sessionId?: string;

  @ApiPropertyOptional({
    description:
      'Exact record text (full-string equality) — the record identity. Quote it verbatim, e.g. from a memory-partition-recall result.',
    example: 'I prefer single-line if statements.',
  })
  @IsString()
  @MaxLength(2000)
  @IsOptional()
  text?: string;

  @ApiPropertyOptional({
    description: 'Full-text containment on the record text.',
    example: 'phone number',
  })
  @IsString()
  @IsOptional()
  contains?: string;

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
    type: Boolean,
    description:
      "true deletes the AI's cognition document for the partition (its accumulated understanding of the user) instead of fact records.",
    example: true,
  })
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  @IsOptional()
  cognition?: boolean;
}
