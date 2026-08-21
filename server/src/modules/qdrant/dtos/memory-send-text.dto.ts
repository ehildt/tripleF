import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

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
    example: 'christopher',
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
}
