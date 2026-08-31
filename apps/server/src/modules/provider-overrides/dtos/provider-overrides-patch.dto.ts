import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  registerDecorator,
  ValidateNested,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

import { isSourceEntry } from '../helpers/is-source-entry.helper.js';

@ValidatorConstraint({ name: 'isSourceEntry', async: false })
class IsSourceEntryConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return isSourceEntry(value);
  }

  defaultMessage(): string {
    return 'must be a hostname, *.glob, or /regex/ pattern';
  }
}

function IsSourceEntry(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsSourceEntryConstraint,
    });
  };
}

/** Shared endpoint patch for Serper + Bright Data (results capped at 200). */
class SearchEndpointOverrideDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ minimum: 1, maximum: 200 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  results?: number;
}

class ScrapeOverrideDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

class SerperOverrideDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ type: SearchEndpointOverrideDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SearchEndpointOverrideDto)
  web?: SearchEndpointOverrideDto;

  @ApiPropertyOptional({ type: SearchEndpointOverrideDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SearchEndpointOverrideDto)
  images?: SearchEndpointOverrideDto;

  @ApiPropertyOptional({ type: SearchEndpointOverrideDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SearchEndpointOverrideDto)
  news?: SearchEndpointOverrideDto;

  @ApiPropertyOptional({ type: SearchEndpointOverrideDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SearchEndpointOverrideDto)
  places?: SearchEndpointOverrideDto;

  @ApiPropertyOptional({ type: SearchEndpointOverrideDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SearchEndpointOverrideDto)
  shopping?: SearchEndpointOverrideDto;

  @ApiPropertyOptional({ type: SearchEndpointOverrideDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SearchEndpointOverrideDto)
  reviews?: SearchEndpointOverrideDto;

  @ApiPropertyOptional({ type: SearchEndpointOverrideDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SearchEndpointOverrideDto)
  videos?: SearchEndpointOverrideDto;

  @ApiPropertyOptional({ type: ScrapeOverrideDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ScrapeOverrideDto)
  scrape?: ScrapeOverrideDto;
}

class BrightDataOverrideDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  serpZone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unlockerZone?: string;

  @ApiPropertyOptional({ type: SearchEndpointOverrideDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SearchEndpointOverrideDto)
  web?: SearchEndpointOverrideDto;

  @ApiPropertyOptional({ type: SearchEndpointOverrideDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SearchEndpointOverrideDto)
  images?: SearchEndpointOverrideDto;

  @ApiPropertyOptional({ type: SearchEndpointOverrideDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SearchEndpointOverrideDto)
  news?: SearchEndpointOverrideDto;

  @ApiPropertyOptional({ type: SearchEndpointOverrideDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SearchEndpointOverrideDto)
  places?: SearchEndpointOverrideDto;

  @ApiPropertyOptional({ type: SearchEndpointOverrideDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SearchEndpointOverrideDto)
  shopping?: SearchEndpointOverrideDto;

  @ApiPropertyOptional({ type: SearchEndpointOverrideDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SearchEndpointOverrideDto)
  videos?: SearchEndpointOverrideDto;

  @ApiPropertyOptional({ type: ScrapeOverrideDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ScrapeOverrideDto)
  scrape?: ScrapeOverrideDto;
}

class EodhdEndpointOverrideDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ minimum: 1, maximum: 1000 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  results?: number;
}

class EodhdNewsOverrideDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ minimum: 1, maximum: 1000 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  results?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  snippetChars?: number;
}

class EodhdOverrideDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ type: EodhdEndpointOverrideDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EodhdEndpointOverrideDto)
  search?: EodhdEndpointOverrideDto;

  @ApiPropertyOptional({ type: EodhdEndpointOverrideDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EodhdEndpointOverrideDto)
  quote?: EodhdEndpointOverrideDto;

  @ApiPropertyOptional({ type: EodhdEndpointOverrideDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EodhdEndpointOverrideDto)
  history?: EodhdEndpointOverrideDto;

  @ApiPropertyOptional({ type: EodhdEndpointOverrideDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EodhdEndpointOverrideDto)
  technical?: EodhdEndpointOverrideDto;

  @ApiPropertyOptional({ type: EodhdEndpointOverrideDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EodhdEndpointOverrideDto)
  intraday?: EodhdEndpointOverrideDto;

  @ApiPropertyOptional({ type: EodhdNewsOverrideDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EodhdNewsOverrideDto)
  news?: EodhdNewsOverrideDto;

  @ApiPropertyOptional({ type: EodhdEndpointOverrideDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EodhdEndpointOverrideDto)
  fundamentals?: EodhdEndpointOverrideDto;
}

class YoutubeEndpointOverrideDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ minimum: 1, maximum: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  results?: number;
}

class YoutubeOverrideDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ type: YoutubeEndpointOverrideDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => YoutubeEndpointOverrideDto)
  videos?: YoutubeEndpointOverrideDto;
}

class SourcesOverrideDto {
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(255, { each: true })
  @IsSourceEntry({ each: true })
  preferred?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(255, { each: true })
  @IsSourceEntry({ each: true })
  blocked?: string[];

  @ApiPropertyOptional({ minimum: 0, maximum: 50 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(50)
  imageTaskReferenceCount?: number;
}

/**
 * Runtime provider-overrides patch, keyed by provider id. Unknown provider
 * keys are rejected by the global ValidationPipe (`forbidNonWhitelisted`).
 */
export class ProviderOverridesPatchDto {
  @ApiPropertyOptional({ type: SerperOverrideDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SerperOverrideDto)
  serper?: SerperOverrideDto;

  @ApiPropertyOptional({ type: BrightDataOverrideDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BrightDataOverrideDto)
  brightData?: BrightDataOverrideDto;

  @ApiPropertyOptional({ type: EodhdOverrideDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EodhdOverrideDto)
  eodhd?: EodhdOverrideDto;

  @ApiPropertyOptional({ type: YoutubeOverrideDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => YoutubeOverrideDto)
  youtube?: YoutubeOverrideDto;

  @ApiPropertyOptional({ type: SourcesOverrideDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SourcesOverrideDto)
  sources?: SourcesOverrideDto;
}
