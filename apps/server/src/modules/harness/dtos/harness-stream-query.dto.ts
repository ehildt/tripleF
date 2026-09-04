import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

/**
 * Query params arrive as strings (`'true'`/`'false'`). `@Type(() => Boolean)`
 * would run `Boolean('false') === true`, so stream=false was always upgraded
 * to true and non-stream mode silently never worked. Parse explicitly.
 */
const parseBoolean = ({ value }: { value: unknown }): boolean =>
  value === true || value === 'true';

export class HarnessStreamQueryDto {
  @ApiPropertyOptional({
    name: 'requestId',
    type: String,
    example: '1234',
    description:
      'Client-provided identifier for correlating request and response.',
  })
  @IsString()
  requestId!: string;

  @ApiPropertyOptional({
    name: 'sessionId',
    type: String,
    example: 'sess-1234',
    description:
      'Client-provided session identifier used for scoping stored images and user context.',
  })
  @IsString()
  @IsOptional()
  sessionId?: string;

  @ApiPropertyOptional({
    name: 'memoryPartition',
    type: String,
    example: 'default',
    description:
      "Memory partition override (settings → system) — the user's memory space. Defaults to the session id; a custom value keeps memory stable across browser-session rotation.",
  })
  @IsString()
  @IsOptional()
  memoryPartition?: string;

  @ApiPropertyOptional({
    name: 'memoryCognition',
    type: String,
    example: 'default',
    description:
      "Memory cognition override (settings → system) — the AI's understanding-of-the-user space. Defaults to the memory partition; a custom value lets the AI's cognition live in its own space.",
  })
  @IsString()
  @IsOptional()
  memoryCognition?: string;

  @ApiPropertyOptional({
    name: 'conversationId',
    type: String,
    example: 'conv-1234',
    description:
      'Client-provided conversation identifier used for scoping stored images within a session.',
  })
  @IsString()
  @IsOptional()
  conversationId?: string;

  @ApiPropertyOptional({
    name: 'roomId',
    type: String,
    example: 'a1b2c3',
    description: 'Socket.IO room used to emit asynchronous results.',
  })
  @IsString()
  @IsOptional()
  roomId?: string;

  @ApiPropertyOptional({
    name: 'stream',
    type: Boolean,
    default: false,
    description: 'Stream partial results via Socket.IO.',
  })
  @IsBoolean()
  @Transform(parseBoolean)
  stream!: boolean;

  @ApiPropertyOptional({
    name: 'event',
    type: String,
    default: 'harness',
    example: 'harness',
    description: 'Socket.IO event name for receiving real-time results.',
  })
  @IsString()
  event!: string;

  @ApiPropertyOptional({
    name: 'numCtx',
    type: Number,
    example: 32000,
    description: 'Maximum token context available to the model.',
  })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  numCtx?: number;

  @ApiPropertyOptional({
    name: 'think',
    type: String,
    default: 'medium',
    example: 'medium',
    description:
      'Controls thinking/reasoning visibility: off, low, medium, high, or boolean.',
  })
  @IsString()
  think!: string;

  @ApiPropertyOptional({
    name: 'sessionMetadata',
    type: String,
    example: '{"images":[{"name":"a.png","hash":"abc123"}]}',
    description:
      'JSON-encoded session-scoped metadata, primarily image references already stored in MinIO.',
  })
  @IsString()
  @IsOptional()
  sessionMetadata?: string;

  @ApiPropertyOptional({
    name: 'hasNewImages',
    type: Boolean,
    default: true,
    description:
      'True when the current request includes new image files that were not previously uploaded.',
  })
  @IsBoolean()
  @IsOptional()
  @Transform(parseBoolean)
  hasNewImages?: boolean;

  @ApiPropertyOptional({
    name: 'language',
    type: String,
    example: 'de',
    description:
      'ISO-639-1 code of the active UI locale (browser-detected or user-selected). Used as the default response language; the model overrides it only when the user explicitly requests a different language.',
  })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiPropertyOptional({
    name: 'graphRag',
    type: Boolean,
    default: false,
    description:
      "Graph-augmented recall: attach the detected cluster summaries of the recalled facts (the memory graph's cluster reports) to the respond context as a TOPIC CONTEXT block.",
  })
  @IsBoolean()
  @IsOptional()
  @Transform(parseBoolean)
  graphRag?: boolean;
}
