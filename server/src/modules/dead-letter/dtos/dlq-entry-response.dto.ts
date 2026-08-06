import { ApiProperty } from '@nestjs/swagger';

export class DlqEntryResponseDto {
  @ApiProperty()
  requestId!: string;

  @ApiProperty()
  queueName!: string;

  @ApiProperty({ required: false })
  jobId?: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ required: false })
  payload?: Record<string, unknown>;

  @ApiProperty({ required: false })
  retryConfig?: Record<string, unknown>;

  @ApiProperty({ required: false })
  failedReason?: string;

  @ApiProperty({ required: false })
  failedAt?: string;

  @ApiProperty()
  attemptsMade!: number;

  @ApiProperty()
  totalAttempts!: number;

  @ApiProperty({ required: false })
  failureHistory?: Array<Record<string, unknown>>;

  @ApiProperty({ required: false })
  nextRetryAt?: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
