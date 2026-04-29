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

import {
  ApiCreateVisionDlq,
  ApiDeleteVisionDlq,
  ApiFindAllVisionDlq,
  ApiFindOneVisionDlq,
  ApiReinstateVisionDlq,
  ApiUpdateVisionDlq,
  ApiUpsertVisionDlq,
} from '../decorators/postgres.openapi.js';
import { CreateVisionDlqDto } from '../dtos/postgres/create-vision-dlq.dto.js';
import { QueryVisionDlqDto } from '../dtos/postgres/query-vision-dlq.dto.js';
import { ReinstateDlqDto } from '../dtos/postgres/reinstate-dlq.dto.js';
import { UpdateVisionDlqDto } from '../dtos/postgres/update-vision-dlq.dto.js';
import { Prisma } from '../generated/prisma/client.js';
import { JobsService } from '../services/jobs.service.js';
import { MinioService } from '../services/minio.service.js';
import { PostgresService } from '../services/postgres.service.js';

@ApiTags('Jobs')
@Controller('jobs/failed')
export class PostgresController {
  constructor(
    private readonly postgresService: PostgresService,
    private readonly minioService: MinioService,
    private readonly jobsService: JobsService,
  ) {}

  @Get()
  @ApiFindAllVisionDlq()
  async findAll(@Query() query: QueryVisionDlqDto) {
    return this.postgresService.findAll({
      status: query.status,
      queueName: query.queueName,
      requestId: query.requestId,
      limit: query.limit ? Number(query.limit) : undefined,
      offset: query.offset ? Number(query.offset) : undefined,
      search: query.search,
    });
  }

  @Get(':requestId')
  @ApiFindOneVisionDlq()
  async findOne(@Param('requestId') requestId: string) {
    const result = await this.postgresService.findById(requestId);
    if (!result) throw new NotFoundException();
    return result;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateVisionDlq()
  async create(@Body() body: CreateVisionDlqDto) {
    const data: Prisma.VisionsDlqCreateInput = {
      requestId: body.requestId,
      queueName: body.queueName,
      jobId: body.jobId,
      status: body.status as Prisma.VisionsDlqCreateInput['status'],
      payload: body.payload as Prisma.InputJsonValue,
      retryConfig: body.retryConfig as Prisma.InputJsonValue,
      failedReason: body.failedReason,
      failedAt: body.failedAt ? new Date(body.failedAt) : undefined,
      attemptsMade: body.attemptsMade,
      totalAttempts: body.totalAttempts,
      failureHistory: body.failureHistory as Prisma.InputJsonValue,
      nextRetryAt: body.nextRetryAt ? new Date(body.nextRetryAt) : undefined,
    };
    return this.postgresService.create(data);
  }

  @Patch(':requestId')
  @ApiUpdateVisionDlq()
  async update(
    @Param('requestId') requestId: string,
    @Body() body: UpdateVisionDlqDto,
  ) {
    const existing = await this.postgresService.findById(requestId);
    if (!existing) throw new NotFoundException();
    if (existing.status === 'PENDING_DELETION') {
      throw new BadRequestException(
        `Cannot modify a job with status 'PENDING_DELETION'`,
      );
    }

    const data: Prisma.VisionsDlqUpdateInput = {
      queueName: body.queueName,
      jobId: body.jobId,
      status: body.status satisfies Prisma.VisionsDlqUpdateInput['status'],
      payload: body.payload as Prisma.InputJsonValue,
      retryConfig: body.retryConfig as Prisma.InputJsonValue,
      failedReason: body.failedReason,
      failedAt: body.failedAt ? new Date(body.failedAt) : undefined,
      attemptsMade: body.attemptsMade,
      totalAttempts: body.totalAttempts,
      failureHistory: body.failureHistory as Prisma.InputJsonValue,
      nextRetryAt: body.nextRetryAt ? new Date(body.nextRetryAt) : undefined,
    };
    return this.postgresService.update(requestId, data);
  }

  @Patch(':requestId/upsert')
  @ApiUpsertVisionDlq()
  async upsert(
    @Param('requestId') requestId: string,
    @Body() body: UpdateVisionDlqDto,
  ) {
    const existing = await this.postgresService.findById(requestId);
    if (existing && existing.status === 'PENDING_DELETION') {
      throw new BadRequestException(
        `Cannot modify a job with status 'PENDING_DELETION'`,
      );
    }

    return this.postgresService.upsert(requestId, {
      queueName: body.queueName,
      jobId: body.jobId,
      status: body.status satisfies Prisma.VisionsDlqCreateInput['status'],
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
  @ApiDeleteVisionDlq()
  async remove(@Param('requestId') requestId: string) {
    const existing = await this.postgresService.findById(requestId);
    if (!existing) throw new NotFoundException();
    return this.postgresService.remove(requestId);
  }

  @Post('reinstate')
  @HttpCode(HttpStatus.OK)
  @ApiReinstateVisionDlq()
  async reinstate(
    @Query('batchSize') batchSize?: string,
    @Body() body?: ReinstateDlqDto,
  ) {
    return this.jobsService.reinstate({
      requestIds: body?.requestIds,
      batchSize: batchSize ? Number(batchSize) : undefined,
    });
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  async cleanup() {
    const { retainJobsAmount, garbageCollectJobsMs } =
      this.postgresService.config;

    if (retainJobsAmount === undefined || garbageCollectJobsMs === undefined) {
      return { deleted: 0, retained: 0 };
    }

    let deleted = 0;

    const toDelete = await this.postgresService.findEligible(
      'PENDING_DELETION',
      retainJobsAmount,
      garbageCollectJobsMs,
    );
    for (const record of toDelete) {
      try {
        await this.minioService.deleteBuffers(record.requestId);
      } catch {
        // buffer cleanup is best-effort
      }
    }
    const deleteIds = toDelete.map((r) => r.requestId);
    deleted += (await this.postgresService.hardDeleteMany(deleteIds)).count;

    const toPendingDeletion = await this.postgresService.findEligible(
      'ARCHIVED',
      retainJobsAmount,
      garbageCollectJobsMs,
    );
    await this.postgresService.moveStatus(
      toPendingDeletion.map((r) => r.requestId),
      'PENDING_DELETION',
    );

    const toArchived = await this.postgresService.findEligible(
      'PENDING_RETRY',
      retainJobsAmount,
      garbageCollectJobsMs,
    );
    await this.postgresService.moveStatus(
      toArchived.map((r) => r.requestId),
      'ARCHIVED',
    );

    return { deleted, retained: retainJobsAmount };
  }
}
