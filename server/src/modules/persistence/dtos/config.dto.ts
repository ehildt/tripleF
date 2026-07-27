import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class UpsertConfigDto {
  @ApiPropertyOptional({ example: 'llama3.2-vision:latest' })
  @IsOptional()
  @IsString()
  selectedModel?: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  preprocessing?: Record<string, unknown>;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  providerOverrides?: Record<string, unknown>;
}
