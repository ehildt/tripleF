import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Prisma } from '../../../generated/prisma/client.js';
import { HARNESS_QUEUE } from '../../bullmq/constants/bullmq.constants.js';
import { JobReinstatementService } from '../../minio/services/job-reinstatement.service.js';
import { MinioService } from '../../minio/services/minio.service.js';
import {
  ApiCreateDlqEntry,
  ApiDeleteDlqEntry,
  ApiFindAllDlqEntries,
  ApiFindOneDlqEntry,
  ApiReinstateDlqEntries,
  ApiUpdateDlqEntry,
  ApiUpsertDlqEntry,
} from '../decorators/openapi.decorators.js';
import { CreateDlqEntryDto } from '../dtos/create-dlq-entry.dto.js';
import { DlqParamsDto } from '../dtos/dlq-params.dto.js';
import { QueryDlqEntriesDto } from '../dtos/query-dlq-entries.dto.js';
import { ReinstateDlqDto } from '../dtos/reinstate-dlq.dto.js';
import { ReinstateQueryDto } from '../dtos/reinstate-query.dto.js';
import { UpdateDlqEntryDto } from '../dtos/update-dlq-entry.dto.js';
import { DeadLetterRepository } from '../services/repository.service.js';

@ApiTags('DLQ')
@Controller('dlq')
export class DeadLetterController {
  constructor(
    private readonly dlqRepository: DeadLetterRepository,
    private readonly minioService: MinioService,
    private readonly jobReinstatementService: JobReinstatementService,
  ) {}

  @Get()
  @ApiFindAllDlqEntries()
  async findAll(@Query() query: QueryDlqEntriesDto) {
    return this.dlqRepository.findAll({
      status: query.status,
      queueName: query.queueName,
      jobName: query.jobName,
      limit: query.limit,
      offset: query.offset,
      search: query.search,
    });
  }

  @Get(':id')
  @ApiFindOneDlqEntry()
  async findOne(@Param() params: DlqParamsDto) {
    const result = await this.dlqRepository.findById(params.id);
    if (!result) throw new NotFoundException();
    return result;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateDlqEntry()
  async create(@Body() body: CreateDlqEntryDto) {
    const data: Prisma.DeadLetterJobCreateInput = {
      queueName: body.queueName,
      jobId: body.jobId,
      jobName: body.jobName,
      status: body.status as Prisma.DeadLetterJobCreateInput['status'],
      payload: body.payload as Prisma.InputJsonValue,
      retryConfig: body.retryConfig as Prisma.InputJsonValue,
      failedReason: body.failedReason,
      failedAt: body.failedAt ? new Date(body.failedAt) : undefined,
      attemptsMade: body.attemptsMade,
      totalAttempts: body.totalAttempts,
      failureHistory: body.failureHistory as Prisma.InputJsonValue,
      nextRetryAt: body.nextRetryAt ? new Date(body.nextRetryAt) : undefined,
    };
    return this.dlqRepository.create(data);
  }

  @Patch(':id')
  @ApiUpdateDlqEntry()
  async update(@Param() params: DlqParamsDto, @Body() body: UpdateDlqEntryDto) {
    const existing = await this.dlqRepository.findById(params.id);
    if (!existing) throw new NotFoundException();
    if (existing.status === 'Removed') {
      throw new BadRequestException(
        `Cannot modify a job with status 'Removed'`,
      );
    }

    const data: Prisma.DeadLetterJobUpdateInput = {
      queueName: body.queueName,
      jobId: body.jobId,
      jobName: body.jobName,
      status: body.status satisfies Prisma.DeadLetterJobUpdateInput['status'],
      payload: body.payload as Prisma.InputJsonValue,
      retryConfig: body.retryConfig as Prisma.InputJsonValue,
      failedReason: body.failedReason,
      failedAt: body.failedAt ? new Date(body.failedAt) : undefined,
      attemptsMade: body.attemptsMade,
      totalAttempts: body.totalAttempts,
      failureHistory: body.failureHistory as Prisma.InputJsonValue,
      nextRetryAt: body.nextRetryAt ? new Date(body.nextRetryAt) : undefined,
    };
    return this.dlqRepository.update(params.id, data);
  }

  @Patch(':id/upsert')
  @ApiUpsertDlqEntry()
  async upsert(@Param() params: DlqParamsDto, @Body() body: UpdateDlqEntryDto) {
    const existing = await this.dlqRepository.findById(params.id);
    if (!existing) throw new NotFoundException();
    if (existing.status === 'Removed') {
      throw new BadRequestException(
        `Cannot modify a job with status 'Removed'`,
      );
    }

    return this.dlqRepository.upsertByQueueJob(
      {
        queueName: existing.queueName,
        jobId: existing.jobId,
        jobName: existing.jobName,
      },
      {
        queueName: body.queueName,
        jobId: body.jobId,
        jobName: body.jobName,
        status: body.status satisfies Prisma.DeadLetterJobCreateInput['status'],
        payload: body.payload as Prisma.InputJsonValue,
        retryConfig: body.retryConfig as Prisma.InputJsonValue,
        failedReason: body.failedReason,
        failedAt: body.failedAt ? new Date(body.failedAt) : undefined,
        attemptsMade: body.attemptsMade,
        totalAttempts: body.totalAttempts,
        failureHistory: body.failureHistory as Prisma.InputJsonValue,
        nextRetryAt: body.nextRetryAt ? new Date(body.nextRetryAt) : undefined,
      },
    );
  }

  @Delete(':id')
  @ApiDeleteDlqEntry()
  async remove(@Param() params: DlqParamsDto) {
    const existing = await this.dlqRepository.findById(params.id);
    if (!existing) throw new NotFoundException();
    return this.dlqRepository.remove(params.id);
  }

  @Post('reinstate')
  @HttpCode(HttpStatus.OK)
  @ApiReinstateDlqEntries()
  async reinstate(
    @Query() query: ReinstateQueryDto,
    @Body() body?: ReinstateDlqDto,
  ) {
    return this.jobReinstatementService.reinstate({
      ids: body?.ids,
      batchSize: query.batchSize,
    });
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  async cleanup() {
    const { failed, cleared, removed } = this.dlqRepository.config;

    const toDelete = await this.dlqRepository.findEligible(
      'Removed',
      removed.retainAmount,
      removed.maxAgeMs,
    );

    for (const record of toDelete) {
      // Only harness turns have buffers; vectorize/queue-agnostic records do not.
      if (record.queueName !== HARNESS_QUEUE) continue;
      try {
        await this.minioService.deleteBuffers(record.jobName);
      } catch {
        // buffer cleanup is best-effort
      }
    }
    const deletedCount = (
      await this.dlqRepository.hardDeleteMany(toDelete.map((r) => r.id))
    ).count;

    const toRemoved = await this.dlqRepository.findEligible(
      'Cleared',
      cleared.retainAmount,
      cleared.maxAgeMs,
    );

    await this.dlqRepository.moveStatus(
      toRemoved.map((r) => r.id),
      'Removed',
    );

    const toCleared = await this.dlqRepository.findEligible(
      'Failed',
      failed.retainAmount,
      failed.maxAgeMs,
    );

    await this.dlqRepository.moveStatus(
      toCleared.map((r) => r.id),
      'Cleared',
    );

    return {
      deleted: deletedCount,
      stages: { failed, cleared, removed },
    };
  }
}
