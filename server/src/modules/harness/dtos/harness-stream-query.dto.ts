import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

import { SHARP_SIZES } from '../../sharp/constants/sharp.constants.js';

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
  @Type(() => Boolean)
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
  @Type(() => Boolean)
  hasNewImages?: boolean;

  @ApiPropertyOptional({
    name: 'pproc_enabled',
    type: Boolean,
    default: false,
    description: 'Enable image preprocessing with multiple variants.',
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  pproc_enabled?: boolean;

  @ApiPropertyOptional({
    name: 'pproc_original',
    type: Boolean,
    default: true,
    description: '[Variant] Include resized original image',
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  pproc_original?: boolean;

  @ApiPropertyOptional({
    name: 'pproc_grayscale',
    type: Boolean,
    default: true,
    description: '[Variant] Grayscale - removes color for luminance focus',
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  pproc_grayscale?: boolean;

  @ApiPropertyOptional({
    name: 'pproc_denoised',
    type: Boolean,
    default: true,
    description: '[Variant] Denoised - Gaussian blur for background smoothing',
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  pproc_denoised?: boolean;

  @ApiPropertyOptional({
    name: 'pproc_sharpened',
    type: Boolean,
    default: false,
    description: '[Variant] Sharpened - edge enhancement for clarity',
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  pproc_sharpened?: boolean;

  @ApiPropertyOptional({
    name: 'pproc_clahe',
    type: Boolean,
    default: true,
    description: '[Variant] CLAHE - adaptive contrast enhancement',
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  pproc_clahe?: boolean;

  @ApiPropertyOptional({
    name: 'pproc_resize_maxWidth',
    type: Number,
    default: 768,
    enum: SHARP_SIZES,
    description: '[Resize] Maximum width in pixels',
  })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  pproc_resize_maxWidth?: number;

  @ApiPropertyOptional({
    name: 'pproc_resize_maxHeight',
    type: Number,
    required: false,
    description:
      '[Resize] Maximum height in pixels (keeps aspect ratio if not set)',
  })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  pproc_resize_maxHeight?: number;

  @ApiPropertyOptional({
    name: 'pproc_resize_withoutEnlargement',
    type: Boolean,
    default: true,
    description: '[Resize] Prevent upscaling images smaller than target',
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  pproc_resize_withoutEnlargement?: boolean;

  @ApiPropertyOptional({
    name: 'pproc_blurSigma',
    type: Number,
    default: 0.5,
    description: '[Param] Gaussian blur sigma for denoising',
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  pproc_blurSigma?: number;

  @ApiPropertyOptional({
    name: 'pproc_sharpenSigma',
    type: Number,
    default: 1,
    description: '[Param] Sharpen sigma value',
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  pproc_sharpenSigma?: number;

  @ApiPropertyOptional({
    name: 'pproc_sharpenM1',
    type: Number,
    default: 1,
    description: '[Param] Sharpen flat area level',
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  pproc_sharpenM1?: number;

  @ApiPropertyOptional({
    name: 'pproc_sharpenM2',
    type: Number,
    default: 2,
    description: '[Param] Sharpen jagged area level',
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  pproc_sharpenM2?: number;

  @ApiPropertyOptional({
    name: 'pproc_brightnessLevel',
    type: Number,
    default: 1.2,
    description: '[Param] Brightness multiplier',
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  pproc_brightnessLevel?: number;

  @ApiPropertyOptional({
    name: 'pproc_claheWidth',
    type: Number,
    default: 8,
    description: '[Param] CLAHE tile width',
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  pproc_claheWidth?: number;

  @ApiPropertyOptional({
    name: 'pproc_claheHeight',
    type: Number,
    default: 8,
    description: '[Param] CLAHE tile height',
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  pproc_claheHeight?: number;

  @ApiPropertyOptional({
    name: 'pproc_claheMaxSlope',
    type: Number,
    default: 3,
    description: '[Param] CLAHE max slope/contrast limit',
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  pproc_claheMaxSlope?: number;

  @ApiPropertyOptional({
    name: 'pproc_normalizeLower',
    type: Number,
    default: 1,
    description: '[Param] Normalization lower percentile',
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  pproc_normalizeLower?: number;

  @ApiPropertyOptional({
    name: 'pproc_normalizeUpper',
    type: Number,
    default: 99,
    description: '[Param] Normalization upper percentile',
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  pproc_normalizeUpper?: number;
}
