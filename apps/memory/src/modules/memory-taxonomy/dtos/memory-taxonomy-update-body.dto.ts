import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Taxonomy node update body: a rename (normalized to the tier's canonical
 * form; the old name is kept as a permanent 'user' alias and propagated
 * across every leaf payload) and/or an icon override (null clears it).
 */
export class MemoryTaxonomyUpdateBodyDto {
  @ApiPropertyOptional({
    description:
      'New label; normalized to the tier’s canonical form (lowercase, hyphen/space-folded). 409 when the name already exists under the same parent — that case is a merge.',
    example: 'survival-games',
  })
  @IsString()
  @MaxLength(120)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description:
      'Lucide icon name from the curated taxonomy set; null clears the icon.',
    example: 'gamepad-2',
    nullable: true,
  })
  @IsString()
  @MaxLength(64)
  @IsOptional()
  icon?: string | null;
}
