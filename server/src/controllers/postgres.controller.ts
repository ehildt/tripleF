import {
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
import { Prisma } from '@prisma/client';

import {
  ApiCreateVisionDlq,
  ApiDeleteVisionDlq,
  ApiFindAllVisionDlq,
  ApiFindOneVisionDlq,
  ApiUpdateVisionDlq,
  ApiUpsertVisionDlq,
} from '../decorators/postgres.openapi.js';
import { CreateVisionDlqDto } from '../dtos/postgres/create-vision-dlq.dto.js';
import { QueryVisionDlqDto } from '../dtos/postgres/query-vision-dlq.dto.js';
import { UpdateVisionDlqDto } from '../dtos/postgres/update-vision-dlq.dto.js';
import { PostgresService } from '../services/postgres.service.js';

@ApiTags('Jobs')
@Controller('api/v1/jobs/failed')
export class PostgresController {
  constructor(private readonly postgresService: PostgresService) {}

  @Get()
  @ApiFindAllVisionDlq()
  async findAll(@Query() query: QueryVisionDlqDto) {
    return this.postgresService.findAll({
      status: query.status,
      queueName: query.queueName,
      requestId: query.requestId,
      limit: query.limit ? Number(query.limit) : undefined,
      offset: query.offset ? Number(query.offset) : undefined,
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
      stacktrace: body.stacktrace,
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
    const data: Prisma.VisionsDlqUpdateInput = {
      queueName: body.queueName,
      jobId: body.jobId,
      status: body.status satisfies Prisma.VisionsDlqUpdateInput['status'],
      payload: body.payload as Prisma.InputJsonValue,
      retryConfig: body.retryConfig as Prisma.InputJsonValue,
      failedReason: body.failedReason,
      stacktrace: body.stacktrace,
      failedAt: body.failedAt ? new Date(body.failedAt) : undefined,
      attemptsMade: body.attemptsMade,
      totalAttempts: body.totalAttempts,
      failureHistory: body.failureHistory as Prisma.InputJsonValue,
      nextRetryAt: body.nextRetryAt ? new Date(body.nextRetryAt) : undefined,
    };
    const result = await this.postgresService.update(requestId, data);
    if (!result) throw new NotFoundException();
    return result;
  }

  @Patch(':requestId/upsert')
  @ApiUpsertVisionDlq()
  async upsert(
    @Param('requestId') requestId: string,
    @Body() body: UpdateVisionDlqDto,
  ) {
    return this.postgresService.upsert(requestId, {
      queueName: body.queueName,
      jobId: body.jobId,
      status: body.status satisfies Prisma.VisionsDlqCreateInput['status'],
      payload: body.payload as Prisma.InputJsonValue,
      retryConfig: body.retryConfig as Prisma.InputJsonValue,
      failedReason: body.failedReason,
      stacktrace: body.stacktrace,
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
    const result = await this.postgresService.remove(requestId);
    if (!result) throw new NotFoundException();
    return result;
  }
}
