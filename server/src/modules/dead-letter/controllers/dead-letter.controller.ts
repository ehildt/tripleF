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
import { QueryDlqEntriesDto } from '../dtos/query-dlq-entries.dto.js';
import { ReinstateDlqDto } from '../dtos/reinstate-dlq.dto.js';
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
      requestId: query.requestId,
      limit: query.limit ? Number(query.limit) : undefined,
      offset: query.offset ? Number(query.offset) : undefined,
      search: query.search,
    });
  }

  @Get(':requestId')
  @ApiFindOneDlqEntry()
  async findOne(@Param('requestId') requestId: string) {
    const result = await this.dlqRepository.findById(requestId);
    if (!result) throw new NotFoundException();
    return result;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateDlqEntry()
  async create(@Body() body: CreateDlqEntryDto) {
    const data: Prisma.HarnessDlqCreateInput = {
      requestId: body.requestId,
      queueName: body.queueName,
      jobId: body.jobId,
      status: body.status as Prisma.HarnessDlqCreateInput['status'],
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

  @Patch(':requestId')
  @ApiUpdateDlqEntry()
  async update(
    @Param('requestId') requestId: string,
    @Body() body: UpdateDlqEntryDto,
  ) {
    const existing = await this.dlqRepository.findById(requestId);
    if (!existing) throw new NotFoundException();
    if (existing.status === 'Removed') {
      throw new BadRequestException(
        `Cannot modify a job with status 'Removed'`,
      );
    }

    const data: Prisma.HarnessDlqUpdateInput = {
      queueName: body.queueName,
      jobId: body.jobId,
      status: body.status satisfies Prisma.HarnessDlqUpdateInput['status'],
      payload: body.payload as Prisma.InputJsonValue,
      retryConfig: body.retryConfig as Prisma.InputJsonValue,
      failedReason: body.failedReason,
      failedAt: body.failedAt ? new Date(body.failedAt) : undefined,
      attemptsMade: body.attemptsMade,
      totalAttempts: body.totalAttempts,
      failureHistory: body.failureHistory as Prisma.InputJsonValue,
      nextRetryAt: body.nextRetryAt ? new Date(body.nextRetryAt) : undefined,
    };
    return this.dlqRepository.update(requestId, data);
  }

  @Patch(':requestId/upsert')
  @ApiUpsertDlqEntry()
  async upsert(
    @Param('requestId') requestId: string,
    @Body() body: UpdateDlqEntryDto,
  ) {
    const existing = await this.dlqRepository.findById(requestId);
    if (existing && existing.status === 'Removed') {
      throw new BadRequestException(
        `Cannot modify a job with status 'Removed'`,
      );
    }

    return this.dlqRepository.upsert(requestId, {
      queueName: body.queueName,
      jobId: body.jobId,
      status: body.status satisfies Prisma.HarnessDlqCreateInput['status'],
      payload: body.payload as Prisma.InputJsonValue,
      retryConfig: body.retryConfig as Prisma.InputJsonValue,
      failedReason: body.failedReason,
      failedAt: body.failedAt ? new Date(body.failedAt) : undefined,
      attemptsMade: body.attemptsMade,
      totalAttempts: body.totalAttempts,
      failureHistory: body.failureHistory as Prisma.InputJsonValue,
      nextRetryAt: body.nextRetryAt ? new Date(body.nextRetryAt) : undefined,
    });
  }

  @Delete(':requestId')
  @ApiDeleteDlqEntry()
  async remove(@Param('requestId') requestId: string) {
    const existing = await this.dlqRepository.findById(requestId);
    if (!existing) throw new NotFoundException();
    return this.dlqRepository.remove(requestId);
  }

  @Post('reinstate')
  @HttpCode(HttpStatus.OK)
  @ApiReinstateDlqEntries()
  async reinstate(
    @Query('batchSize') batchSize?: string,
    @Body() body?: ReinstateDlqDto,
  ) {
    return this.jobReinstatementService.reinstate({
      requestIds: body?.requestIds,
      batchSize: batchSize ? Number(batchSize) : undefined,
    });
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  async cleanup() {
    const { failed, cleared, removed } = this.dlqRepository.config;

    let deletedCount = 0;

    const toDelete = await this.dlqRepository.findEligible(
      'Removed',
      removed.retainAmount,
      removed.maxAgeMs,
    );

    for (const record of toDelete) {
      try {
        await this.minioService.deleteBuffers(record.requestId);
      } catch {
        // buffer cleanup is best-effort
      }
    }
    const deleteIds = toDelete.map((r) => r.requestId);
    deletedCount += (await this.dlqRepository.hardDeleteMany(deleteIds)).count;

    const toDeleted = await this.dlqRepository.findEligible(
      'Cleared',
      cleared.retainAmount,
      cleared.maxAgeMs,
    );

    await this.dlqRepository.moveStatus(
      toDeleted.map((r) => r.requestId),
      'Removed',
    );

    const toCleared = await this.dlqRepository.findEligible(
      'Failed',
      failed.retainAmount,
      failed.maxAgeMs,
    );

    await this.dlqRepository.moveStatus(
      toCleared.map((r) => r.requestId),
      'Cleared',
    );

    return {
      deleted: deletedCount,
      stages: { failed, cleared, removed },
    };
  }
}
