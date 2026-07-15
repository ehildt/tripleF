import { IsEnum, IsNumberString, IsOptional, IsString } from 'class-validator';

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
  requestId?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;

  @IsOptional()
  @IsNumberString()
  offset?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
