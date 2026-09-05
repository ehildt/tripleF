import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class MemoryPruneQueryDto {
  @ApiProperty({
    description:
      'Memory partition to prune (the user-set partition id or a session id) — its fact records only; deletes are never anonymous. The AI cognition lane has its own wipe (DELETE /memory/text?cognition=true).',
    example: 'default',
  })
  @IsString()
  memoryPartition!: string;

  @ApiPropertyOptional({
    description:
      "Optional conversation scope — prunes only that conversation's fact records instead of the whole partition.",
    example: 'conv-1234',
  })
  @IsString()
  @IsOptional()
  conversationId?: string;
}
