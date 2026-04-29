import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

import { DLQ_STATUSES } from '../../constants/postgres.constants.js';
import { Prisma } from '../../generated/prisma/client.js';

const statuses = DLQ_STATUSES;

export class UpdateVisionDlqDto {
  @IsOptional()
  @IsString()
  queueName?: string;

  @IsOptional()
  @IsString()
  jobId?: string;

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
