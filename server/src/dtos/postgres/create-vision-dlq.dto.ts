import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

import { DLQ_STATUSES } from '../../constants/postgres.constants.js';

export const STATUSES = DLQ_STATUSES;

export class CreateVisionDlqDto {
  @IsString()
  @IsNotEmpty()
  requestId!: string;

  @IsString()
  @IsNotEmpty()
  queueName!: string;

  @IsOptional()
  @IsString()
  jobId?: string;

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
  @IsString()
  stacktrace?: string;

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
