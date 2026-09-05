import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * Partial patch for the Ollama connection override. Each key merges into the
 * stored overrides independently, so a patch may touch only the host or the
 * key. Mirrors the `OllamaOverridesPatch` service type.
 */
export class OllamaOverridesPatchDto {
  @ApiPropertyOptional({ example: 'http://127.0.0.1:11434/api' })
  @IsOptional()
  @IsString()
  host?: string;

  @ApiPropertyOptional({ example: 'sk-…' })
  @IsOptional()
  @IsString()
  apiKey?: string;
}
