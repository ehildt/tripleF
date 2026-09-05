import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

import { DLQ_STATUSES } from '../constants/postgres.constants.js';

const statuses = DLQ_STATUSES;

export class QueryDlqEntriesDto {
  @IsOptional()
  @IsEnum(statuses)
  status?: (typeof statuses)[number];

  @IsOptional()
  @IsString()
  queueName?: string;

  @IsOptional()
  @IsString()
  jobName?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === undefined ? undefined : Number(value),
  )
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === undefined ? undefined : Number(value),
  )
  @IsInt()
  @Min(0)
  offset?: number;

  @IsOptional()
  @IsString()
  search?: string;
}
