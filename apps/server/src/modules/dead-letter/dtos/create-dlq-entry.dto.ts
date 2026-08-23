import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

import { DLQ_STATUSES } from '../constants/postgres.constants.js';

export const STATUSES = DLQ_STATUSES;

export class CreateDlqEntryDto {
  @IsString()
  @IsNotEmpty()
  queueName!: string;

  @IsString()
  @IsNotEmpty()
  jobId!: string;

  @IsString()
  @IsNotEmpty()
  jobName!: string;

  @IsOptional()
  @IsEnum(STATUSES)
  status?: (typeof STATUSES)[number];

  @IsOptional()
  @IsObject()
  payload?: unknown;

  @IsOptional()
  @IsObject()
  retryConfig?: unknown;

  @IsOptional()
  @IsString()
  failedReason?: string;

  @IsOptional()
  @IsDateString()
  failedAt?: string;

  @IsOptional()
  @IsNumber()
  attemptsMade?: number;

  @IsOptional()
  @IsNumber()
  totalAttempts?: number;

  @IsOptional()
  @IsObject()
  failureHistory?: unknown;

  @IsOptional()
  @IsDateString()
  nextRetryAt?: string;
}
