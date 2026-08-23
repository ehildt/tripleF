import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
    example: 'christopher',
  })
  memoryPartition?: string;

  @ApiPropertyOptional({
    description:
      "Cognition key the record belongs to — the AI's understanding-of-the-user space (set on the cognition document).",
    example: 'christopher',
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
    description: 'Conversation the record originates from, when known.',
    example: 'conv-1234',
  })
  conversationId?: string;

  @ApiPropertyOptional({
    description: 'Request/turn id this record was created from, when known.',
    example: 'req-1234',
  })
  requestId?: string;
}
