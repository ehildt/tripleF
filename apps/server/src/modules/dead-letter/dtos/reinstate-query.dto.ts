import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Query params for the DLQ reinstate trigger. `batchSize` caps how many
 * failed/cleared jobs are re-enqueued in one call — reinstate re-adds each
 * job inline, so the cap keeps the request bounded.
 */
export class ReinstateQueryDto {
  @ApiPropertyOptional({
    type: Number,
    default: 10,
    minimum: 1,
    maximum: 100,
    description:
      'Max failed/cleared jobs to reinstate in one call (capped at 100).',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === undefined ? undefined : Number(value),
  )
  @IsInt()
  @Min(1)
  @Max(100)
  batchSize?: number;
}
