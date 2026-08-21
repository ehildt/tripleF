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

  @ApiPropertyOptional({
    description:
      "Memory partition id (sysctl → system) — the user's memory space. Defaults to the session id; a custom value keeps memory stable across browser-session rotation.",
    example: 'christopher',
  })
  @IsOptional()
  @IsString()
  memoryPartition?: string;

  @ApiPropertyOptional({
    description:
      "Memory cognition id (sysctl → system) — the AI's understanding-of-the-user space. Defaults to the memory partition; a custom value lets the AI's cognition live in its own space.",
    example: 'christopher',
  })
  @IsOptional()
  @IsString()
  memoryCognition?: string;
}
