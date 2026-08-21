import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

import { Prisma } from '../../../generated/prisma/client.js';
import { DLQ_STATUSES } from '../constants/postgres.constants.js';

const statuses = DLQ_STATUSES;

export class UpdateDlqEntryDto {
  @IsOptional()
  @IsString()
  queueName?: string;

  @IsOptional()
  @IsString()
  jobId?: string;

  @IsOptional()
  @IsString()
  jobName?: string;

  @IsOptional()
  @IsEnum(statuses)
  status?: (typeof statuses)[number];

  @IsOptional()
  @IsObject()
  payload?: Prisma.InputJsonValue;

  @IsOptional()
  @IsObject()
  retryConfig?: Prisma.InputJsonValue;

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
  failureHistory?: Prisma.InputJsonValue;

  @IsOptional()
  @IsDateString()
  nextRetryAt?: string;
}
