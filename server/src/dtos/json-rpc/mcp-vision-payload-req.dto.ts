import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import type { PreprocessingSize } from '../../constants/image-preprocessing.constants.js';
import { VisionTask } from '../classic/get-fastify-multipart-data-req.dto.js';
import { Prompt } from '../prompt.dto.js';

import {
  McpGenericType,
  SupportedToolFunction,
  SupportedToolMethod,
} from './mcp.model.js';

class McpImageDataDto {
  @IsString()
  @ApiProperty({ description: 'Base64-encoded image bytes' })
  data!: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Image MIME type (e.g. image/png)' })
  mimeType?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Optional filename' })
  name?: string;
}

class McpPreprocessingResizeDto {
  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({
    type: Number,
    description:
      'Maximum width in pixels (allowed: 256, 384, 512, 640, 768, 1024)',
    default: 768,
  })
  maxWidth?: PreprocessingSize;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({
    type: Number,
    description: 'Maximum height in pixels (keeps aspect ratio if not set)',
    default: null,
  })
  maxHeight?: number | null;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    type: Boolean,
    description: 'Prevent upscaling images smaller than target',
    default: true,
  })
  withoutEnlargement?: boolean;
}

class McpPreprocessingVariantsDto {
  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    type: Boolean,
    description: 'Resized original image',
    default: true,
  })
  original?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    type: Boolean,
    description: 'Grayscale - removes color for luminance focus',
    default: true,
  })
  grayscale?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    type: Boolean,
    description: 'Denoised - Gaussian blur for background smoothing',
    default: true,
  })
  denoised?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    type: Boolean,
    description: 'Sharpened - edge enhancement for clarity',
    default: false,
  })
  sharpened?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    type: Boolean,
    description: 'CLAHE - adaptive contrast enhancement',
    default: true,
  })
  clahe?: boolean;
}

class McpPreprocessingParametersDto {
  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({
    type: Number,
    description: 'Gaussian blur sigma for denoising',
    default: 0.5,
  })
  blurSigma?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({
    type: Number,
    description: 'Sharpen sigma value',
    default: 1,
  })
  sharpenSigma?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({
    type: Number,
    description: 'Sharpen flat area level',
    default: 1,
  })
  sharpenM1?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({
    type: Number,
    description: 'Sharpen jagged area level',
    default: 2,
  })
  sharpenM2?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({
    type: Number,
    description: 'Brightness multiplier',
    default: 1.2,
  })
  brightnessLevel?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({
    type: Number,
    description: 'CLAHE tile width',
    default: 8,
  })
  claheWidth?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({
    type: Number,
    description: 'CLAHE tile height',
    default: 8,
  })
  claheHeight?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({
    type: Number,
    description: 'CLAHE max slope/contrast limit',
    default: 3,
  })
  claheMaxSlope?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({
    type: Number,
    description: 'Normalization lower percentile',
    default: 1,
  })
  normalizeLower?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({
    type: Number,
    description: 'Normalization upper percentile',
    default: 99,
  })
  normalizeUpper?: number;
}

class McpPreprocessingOptionsDto {
  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    type: Boolean,
    description: 'Enable image preprocessing with multiple variants',
    default: false,
  })
  enabled?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => McpPreprocessingResizeDto)
  @ApiPropertyOptional({
    type: McpPreprocessingResizeDto,
    description: 'Resize options for all variants',
  })
  resize?: McpPreprocessingResizeDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => McpPreprocessingVariantsDto)
  @ApiPropertyOptional({
    type: McpPreprocessingVariantsDto,
    description: 'Toggle each image variant',
  })
  variants?: McpPreprocessingVariantsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => McpPreprocessingParametersDto)
  @ApiPropertyOptional({
    type: McpPreprocessingParametersDto,
    description: 'Processing parameters with defaults',
  })
  parameters?: McpPreprocessingParametersDto;
}

class JsonRpcVisionPayloadReq_Params_Arguments {
  constructor(obj?: JsonRpcVisionPayloadReq_Params_Arguments) {
    if (obj) Object.assign(this, obj);
  }

  @IsString()
  @ApiProperty({
    description: 'Client-provided request correlation identifier',
  })
  requestId!: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Socket.IO room identifier for routing results',
    example: 'room-123',
  })
  roomId?: string;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    type: Boolean,
    description:
      'When enabled, the server streams partial results via Socket.IO',
    default: false,
  })
  stream?: boolean;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    type: String,
    description: 'Socket.IO event name for receiving real-time results',
    default: 'vision',
  })
  event?: string;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({
    type: Number,
    description: 'Maximum token context available to the model',
    default: null,
  })
  numCtx?: number;

  @IsString()
  @ApiProperty({ description: 'Ollama vision model to use' })
  model!: string;

  @IsOptional()
  @IsArray()
  @Type(() => Prompt)
  @ValidateNested({ each: true })
  @ApiPropertyOptional({
    type: Prompt,
    isArray: true,
    description:
      'Optional textual instruction to guide the selected vision task',
  })
  prompt?: Array<Prompt>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => McpImageDataDto)
  @ApiPropertyOptional({
    type: McpImageDataDto,
    isArray: true,
    description: 'Base64-encoded images for analysis',
  })
  images?: Array<McpImageDataDto>;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    type: String,
    enum: ['describe', 'compare', 'ocr'] satisfies Array<VisionTask>,
    example: 'describe' as VisionTask,
  })
  task?: VisionTask;

  @IsOptional()
  @ValidateNested()
  @Type(() => McpPreprocessingOptionsDto)
  @ApiPropertyOptional({
    type: McpPreprocessingOptionsDto,
    description: 'Image preprocessing options for enhanced AI analysis',
  })
  preprocessing?: McpPreprocessingOptionsDto;
}

export class McpVisionPayloadReq_Params {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    example: 'visions.analyze' satisfies SupportedToolFunction,
    enum: ['visions.analyze'] satisfies Array<SupportedToolFunction>,
  })
  name?: SupportedToolFunction;

  @ApiProperty({
    type: JsonRpcVisionPayloadReq_Params_Arguments,
    description: 'Tool arguments as defined by the tool inputSchema',
  })
  @IsObject()
  @Type(() => JsonRpcVisionPayloadReq_Params_Arguments)
  @ValidateNested()
  arguments!: JsonRpcVisionPayloadReq_Params_Arguments;
}

export class McpVisionPayloadReq implements McpGenericType {
  @ApiProperty({ example: 2 })
  @IsNumber()
  id!: number;

  @ApiProperty({ example: '2.0' })
  @IsIn(['2.0'])
  jsonrpc!: '2.0';

  @ApiProperty({ example: 'tools/call' satisfies SupportedToolMethod })
  @IsString()
  method!: SupportedToolMethod;

  @ApiProperty({ type: McpVisionPayloadReq_Params })
  @ValidateNested()
  @Type(() => McpVisionPayloadReq_Params)
  params!: McpVisionPayloadReq_Params;
}
