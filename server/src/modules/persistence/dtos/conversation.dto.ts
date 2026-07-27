import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class ConversationExchangeDto {
  @ApiProperty({ example: 'user' })
  @IsString()
  @IsNotEmpty()
  role!: 'user' | 'assistant';

  @ApiProperty({ example: 'Tell me about this image.' })
  @IsString()
  content!: string;

  @ApiPropertyOptional({ example: 'req-abc123' })
  @IsOptional()
  @IsString()
  requestId?: string;

  @ApiPropertyOptional({ example: 'done' })
  @IsOptional()
  @IsString()
  status?: 'pending' | 'streaming' | 'done' | 'error';

  @ApiPropertyOptional({ example: 1_700_000_000_000 })
  @IsOptional()
  @IsNumber()
  timestamp?: number;

  @ApiPropertyOptional({ example: 'llama3.2-vision:latest' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ example: 'harness' })
  @IsOptional()
  @IsString()
  event?: string;

  @ApiPropertyOptional({ example: 'room-1' })
  @IsOptional()
  @IsString()
  roomId?: string;

  @ApiPropertyOptional({ example: 'conv-123' })
  @IsOptional()
  @IsString()
  conversationId?: string;

  @ApiPropertyOptional({ example: 128 })
  @IsOptional()
  @IsNumber()
  promptEvalCount?: number;

  @ApiPropertyOptional({ example: 64 })
  @IsOptional()
  @IsNumber()
  evalCount?: number;

  @ApiPropertyOptional({ example: 64 })
  @IsOptional()
  @IsNumber()
  inputTokenDelta?: number;

  @ApiPropertyOptional()
  @IsOptional()
  activity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  reasoning?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  included?: boolean;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'object' },
    example: [{ name: 'a.png', hash: 'abc123' }],
  })
  @IsOptional()
  images?: Array<Record<string, unknown>>;
}

export class ConversationContentDto {
  @ApiPropertyOptional({ example: 'New Conversation' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'llama3.2-vision:latest' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ example: '65536' })
  @IsOptional()
  @IsString()
  numCtx?: string;

  @ApiPropertyOptional({ example: 'medium' })
  @IsOptional()
  @IsString()
  think?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  stream?: boolean;

  @ApiPropertyOptional({ example: 'harness' })
  @IsOptional()
  @IsString()
  event?: string;

  @ApiPropertyOptional({ example: 'room-1' })
  @IsOptional()
  @IsString()
  roomId?: string;

  @ApiPropertyOptional({ example: 'temporary' })
  @IsOptional()
  @IsString()
  type?: 'temporary' | 'persistent';

  @ApiPropertyOptional({ example: 'analysis' })
  @IsOptional()
  @IsString()
  task?: string;

  @ApiProperty({ type: [ConversationExchangeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConversationExchangeDto)
  exchanges!: ConversationExchangeDto[];

  @ApiPropertyOptional({ type: 'array', items: { type: 'object' } })
  @IsOptional()
  @IsArray()
  savedFileInfos?: Array<Record<string, unknown>>;

  @ApiPropertyOptional({ type: 'array', items: { type: 'object' } })
  @IsOptional()
  @IsArray()
  uploadedImages?: Array<Record<string, unknown>>;

  @ApiPropertyOptional({ type: 'array', items: { type: 'object' } })
  @IsOptional()
  @IsArray()
  subscriptions?: Array<Record<string, unknown>>;
}

export class UpsertConversationDto {
  @ApiProperty({ type: ConversationContentDto })
  @ValidateNested()
  @Type(() => ConversationContentDto)
  content!: ConversationContentDto;
}
