import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/** Scope for the memory link graph — one lane, exactly like the list endpoint. */
export class MemoryLinksQueryDto {
  @ApiPropertyOptional({
    description: "Restrict to one memory partition (the user's fact space).",
    example: 'christopher',
  })
  @IsString()
  @IsOptional()
  memoryPartition?: string;

  @ApiPropertyOptional({
    description:
      "Restrict to one cognition key (the AI's understanding space).",
    example: 'christopher',
  })
  @IsString()
  @IsOptional()
  memoryCognition?: string;
}
