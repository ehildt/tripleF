import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

import type { MemoryRole } from '../models/memory.model.js';

/** One memory record as returned by list/search — the payload text IS the record. */
export class MemoryItemDto {
  @ApiProperty({
    description: 'Qdrant point id (deterministic UUID)',
    example: '9f1c…',
  })
  id!: string;

  @ApiProperty({
    description: 'The record text (an extracted fact or a verbatim remember).',
    example: 'User prefers single-line if statements.',
  })
  text!: string;

  @ApiProperty({
    enum: ['user', 'assistant'],
    description: 'Turn side this record originated from.',
  })
  role!: MemoryRole;

  @ApiPropertyOptional({
    description:
      "Memory partition the record belongs to — the user's fact space (set on fact records).",
    example: 'default',
  })
  memoryPartition?: string;

  @ApiPropertyOptional({
    description:
      "Cognition key the record belongs to — the AI's understanding-of-the-user space (set on the cognition document).",
    example: 'default',
  })
  memoryCognition?: string;

  @ApiPropertyOptional({
    description: 'Browser/session the record originated in.',
    example: 'sess-1234',
  })
  sessionId?: string;

  @ApiProperty({
    type: [String],
    description:
      'Topic labels written by the extraction pass or the remember tool — the open filter vocabulary.',
    example: ['work', 'rust'],
  })
  tags!: string[];

  @ApiPropertyOptional({
    description:
      'Broad category written by the remember tool (e.g. games, pets) — groups narrow tag topics into one family for the constellation cluster tier.',
    example: 'games',
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  category?: string;

  @ApiPropertyOptional({
    description:
      'The entity the fact is about — extraction-classified; maintenance only compares records of the same subject.',
    example: 'user',
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  subject?: string;

  @ApiPropertyOptional({
    description:
      'What kind of durable thing this is — extraction-classified (preference, decision, state, contact, project, possession, relationship, fact).',
    example: 'preference',
  })
  @IsOptional()
  @IsString()
  kind?: string;

  @ApiPropertyOptional({
    description:
      'Whether a newer statement is expected to replace this one — extraction-classified (durable | volatile).',
    example: 'volatile',
  })
  @IsOptional()
  @IsString()
  stability?: string;

  @ApiPropertyOptional({
    description: 'Conversation the record originates from, when known.',
    example: 'conv-1234',
  })
  conversationId?: string;

  @ApiPropertyOptional({
    description: 'Request/turn id this record was created from, when known.',
    example: 'req-1234',
  })
  requestId?: string;

  @ApiPropertyOptional({
    description: 'True once the consolidation sweep adjudicated this record.',
  })
  isConsolidated?: boolean;

  @ApiPropertyOptional({
    description: 'True once the reflection pass reviewed this record.',
  })
  isReflected?: boolean;

  @ApiPropertyOptional({
    description:
      'True once the conviction-synthesis pass offered this record as evidence.',
  })
  isSynthesized?: boolean;

  @ApiPropertyOptional({
    description: 'True while the record is involved in an open friction.',
  })
  isFriction?: boolean;

  @ApiPropertyOptional({
    description: 'True when a friction resolution marked this record stale.',
  })
  superseded?: boolean;

  @ApiPropertyOptional({
    description: 'Record id that superseded this one.',
  })
  supersededBy?: string;

  @ApiPropertyOptional({
    type: [String],
    description:
      'Point ids this statement cites as its supporting evidence (conviction/bridge records only).',
    example: ['9f1c…', 'a3b2…'],
  })
  evidenceIds?: string[];
}
