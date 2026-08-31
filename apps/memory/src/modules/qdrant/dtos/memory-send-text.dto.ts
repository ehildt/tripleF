import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class MemorySendTextDto {
  @ApiProperty({
    description:
      'Persistent socket session id — the record origin and default partition.',
    example: 'sess-1234',
  })
  @IsString()
  sessionId!: string;

  @ApiPropertyOptional({
    description:
      "Memory partition the record belongs to — the user's fact space. Defaults to sessionId; set a stable custom partition id (see sysctl → system) so memory survives browser-session rotation.",
    example: 'default',
  })
  @IsString()
  @IsOptional()
  memoryPartition?: string;

  @ApiProperty({
    description: 'Text to store verbatim as one memory record.',
    example: 'I prefer single-line if statements.',
  })
  @IsString()
  @MaxLength(8000)
  text!: string;

  @ApiPropertyOptional({
    description: 'Conversation the record originates from, when known.',
    example: 'conv-1234',
  })
  @IsString()
  @IsOptional()
  conversationId?: string;

  @ApiPropertyOptional({
    description: 'Request id to trace the record back to, when known.',
    example: 'req-1234',
  })
  @IsString()
  @IsOptional()
  requestId?: string;

  @ApiPropertyOptional({
    type: [String],
    maxItems: 8,
    description:
      'Topic labels written by the remember tool — the recall filter vocabulary.',
    example: ['contacts', 'work'],
  })
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({
    description:
      'Broad category the record belongs to (e.g. games, pets, work, health) — groups narrow tag topics into one family for the constellation category tier (cluster fallback).',
    example: 'games',
  })
  @IsString()
  @MaxLength(40)
  @IsOptional()
  category?: string;
}
