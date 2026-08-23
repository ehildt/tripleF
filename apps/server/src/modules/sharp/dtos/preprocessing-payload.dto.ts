import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  ValidateNested,
} from 'class-validator';

import { SHARP_SIZES, type SharpSize } from '../types/sharp-size.type.js';

class PreprocessingResizePayload {
  @ApiPropertyOptional({
    name: 'maxWidth',
    type: Number,
    enum: SHARP_SIZES,
    description: 'Maximum width in pixels',
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  maxWidth?: SharpSize;

  @ApiPropertyOptional({
    name: 'maxHeight',
    type: Number,
    required: false,
    description: 'Maximum height in pixels (keeps aspect ratio if not set)',
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  maxHeight?: number | null;

  @ApiPropertyOptional({
    name: 'withoutEnlargement',
    type: Boolean,
    description: 'Prevent upscaling images smaller than target',
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  withoutEnlargement?: boolean;
}

class PreprocessingVariantsPayload {
  @ApiPropertyOptional({
    name: 'original',
    type: Boolean,
    description: '[Variant] Include resized original image',
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  original?: boolean;

  @ApiPropertyOptional({
    name: 'grayscale',
    type: Boolean,
    description: '[Variant] Grayscale - removes color for luminance focus',
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  grayscale?: boolean;

  @ApiPropertyOptional({
    name: 'denoised',
    type: Boolean,
    description: '[Variant] Denoised - Gaussian blur for background smoothing',
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  denoised?: boolean;

  @ApiPropertyOptional({
    name: 'sharpened',
    type: Boolean,
    description: '[Variant] Sharpened - edge enhancement for clarity',
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  sharpened?: boolean;

  @ApiPropertyOptional({
    name: 'clahe',
    type: Boolean,
    description: '[Variant] CLAHE - adaptive contrast enhancement',
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  clahe?: boolean;
}

class PreprocessingParametersPayload {
  @ApiPropertyOptional({
    name: 'blurSigma',
    type: Number,
    description: '[Param] Gaussian blur sigma for denoising',
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  blurSigma?: number;

  @ApiPropertyOptional({
    name: 'sharpenSigma',
    type: Number,
    description: '[Param] Sharpen sigma value',
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  sharpenSigma?: number;

  @ApiPropertyOptional({
    name: 'sharpenM1',
    type: Number,
    description: '[Param] Sharpen flat area level',
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  sharpenM1?: number;

  @ApiPropertyOptional({
    name: 'sharpenM2',
    type: Number,
    description: '[Param] Sharpen jagged area level',
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  sharpenM2?: number;

  @ApiPropertyOptional({
    name: 'brightnessLevel',
    type: Number,
    description: '[Param] Brightness multiplier',
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  brightnessLevel?: number;

  @ApiPropertyOptional({
    name: 'claheWidth',
    type: Number,
    description: '[Param] CLAHE tile width',
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  claheWidth?: number;

  @ApiPropertyOptional({
    name: 'claheHeight',
    type: Number,
    description: '[Param] CLAHE tile height',
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  claheHeight?: number;

  @ApiPropertyOptional({
    name: 'claheMaxSlope',
    type: Number,
    description: '[Param] CLAHE max slope/contrast limit',
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  claheMaxSlope?: number;

  @ApiPropertyOptional({
    name: 'normalizeLower',
    type: Number,
    description: '[Param] Normalization lower percentile',
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  normalizeLower?: number;

  @ApiPropertyOptional({
    name: 'normalizeUpper',
    type: Number,
    description: '[Param] Normalization upper percentile',
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  normalizeUpper?: number;
}

export class PreprocessingPayload {
  @ApiPropertyOptional({
    name: 'enabled',
    type: Boolean,
    description: 'Master toggle for preprocessing',
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  enabled?: boolean;

  @ApiPropertyOptional({
    name: 'resize',
    type: PreprocessingResizePayload,
    description: 'Resize options',
  })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => PreprocessingResizePayload)
  resize?: PreprocessingResizePayload;

  @ApiPropertyOptional({
    name: 'variants',
    type: PreprocessingVariantsPayload,
    description: 'Variant toggles',
  })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => PreprocessingVariantsPayload)
  variants?: PreprocessingVariantsPayload;

  @ApiPropertyOptional({
    name: 'parameters',
    type: PreprocessingParametersPayload,
    description: 'Processing parameters',
  })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => PreprocessingParametersPayload)
  parameters?: PreprocessingParametersPayload;
}
