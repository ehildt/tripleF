import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

import { SHARP_SIZES, type SharpSize } from '../types/sharp-size.type.js';

class SharpResizePatchDto {
  @ApiPropertyOptional({ enum: SHARP_SIZES })
  @IsOptional()
  @IsIn(SHARP_SIZES)
  maxWidth?: SharpSize;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(64)
  @Max(4096)
  maxHeight?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  withoutEnlargement?: boolean;
}

class SharpVariantsPatchDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  original?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  grayscale?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  denoised?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  sharpened?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  clahe?: boolean;
}

class SharpParametersPatchDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  blurSigma?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  sharpenSigma?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  sharpenM1?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  sharpenM2?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(5)
  contrastLevel?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(5)
  brightnessLevel?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(64)
  claheWidth?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(64)
  claheHeight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  claheMaxSlope?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  normalizeLower?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  normalizeUpper?: number;
}

/**
 * Partial patch for the preprocessing config. Each section merges into the
 * stored overrides independently, so a patch may touch a single parameter.
 * Mirrors the `SharpOverridesPatch` service type.
 */
export class SharpOverridesPatchDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ type: SharpResizePatchDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SharpResizePatchDto)
  resize?: SharpResizePatchDto;

  @ApiPropertyOptional({ type: SharpVariantsPatchDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SharpVariantsPatchDto)
  variants?: SharpVariantsPatchDto;

  @ApiPropertyOptional({ type: SharpParametersPatchDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SharpParametersPatchDto)
  parameters?: SharpParametersPatchDto;
}
