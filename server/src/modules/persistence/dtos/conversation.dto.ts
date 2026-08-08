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

class ConversationExchangeDto {
  @ApiProperty({ example: 'exchange-id-1' })
  @IsString()
  @IsNotEmpty()
  id!: string;

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

  @ApiPropertyOptional({
    description:
      'Language the model chose to respond in (for activity labels).',
  })
  @IsOptional()
  @IsString()
  activityLanguage?: string;

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
    example: [{ name: 'search', category: 'web', status: 'start' }],
  })
  @IsOptional()
  @IsArray()
  toolCalls?: Array<Record<string, unknown>>;

  @ApiPropertyOptional({ example: 'news' })
  @IsOptional()
  @IsString()
  harnessTemplate?: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  harnessData?: Record<string, unknown>;

  @ApiPropertyOptional({ example: 'streamed text' })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'object' },
    example: [{ name: 'a.png', hash: 'abc123' }],
  })
  @IsOptional()
  images?: Array<Record<string, unknown>>;

  @ApiPropertyOptional({
    description:
      'Chart series streamed from EODHD tools, keyed by tool name:ticker.',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  chartData?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Whether the buffered charts have been revealed.',
  })
  @IsOptional()
  revealCharts?: boolean;
}

class ConversationContentDto {
  @ApiProperty({ example: 'conversation-id-1' })
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({ example: 'conv-123' })
  @IsString()
  @IsNotEmpty()
  conversationId!: string;

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

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: { type: 'boolean' },
  })
  @IsOptional()
  imageSelectionSnapshot?: Record<string, boolean>;

  @ApiPropertyOptional({ type: 'array', items: { type: 'object' } })
  @IsOptional()
  @IsArray()
  subscriptions?: Array<Record<string, unknown>>;

  @ApiPropertyOptional({ example: 1_700_000_000_000 })
  @IsOptional()
  @IsNumber()
  createdAt?: number;

  @ApiPropertyOptional({ example: 1_700_000_000_000 })
  @IsOptional()
  @IsNumber()
  updatedAt?: number;

  @ApiPropertyOptional({ example: '30.00', nullable: true })
  @IsOptional()
  @IsString()
  contextUsagePercent?: string | null;
}

export class UpsertConversationDto {
  @ApiProperty({ type: ConversationContentDto })
  @ValidateNested()
  @Type(() => ConversationContentDto)
  content!: ConversationContentDto;
}
