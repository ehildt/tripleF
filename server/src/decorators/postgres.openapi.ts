import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';

import { BULLMQ_QUEUE } from '../constants/bullmq.constants.js';
import {
  CreateVisionDlqDto,
  STATUSES,
} from '../dtos/postgres/create-vision-dlq.dto.js';
import { UpdateVisionDlqDto } from '../dtos/postgres/update-vision-dlq.dto.js';
import { VisionDlqResponseDto } from '../dtos/postgres/vision-dlq-response.dto.js';

const ApiParamRequestId = () =>
  ApiParam({
    name: 'requestId',
    required: true,
    type: String,
    description: 'The requestId (primary key) of the visions_dlq entry',
  });

export const ApiCreateVisionDlq = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Create a new visions_dlq entry',
      description:
        'Persists a failed BullMQ job into Postgres for later reinsertion.',
    }),
    ApiBody({ type: CreateVisionDlqDto }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Entry created successfully',
      type: VisionDlqResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Validation error',
    }),
  );

export const ApiFindAllVisionDlq = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Query visions_dlq entries',
      description:
        'Paginated query with optional filters by status, queueName, nextRetryAt range, and requestId.',
    }),
    ApiQuery({ name: 'status', required: false, type: String, enum: STATUSES }),
    ApiQuery({
      name: 'queueName',
      required: false,
      type: String,
      enum: BULLMQ_QUEUE,
    }),
    ApiQuery({ name: 'requestId', required: false, type: String }),
    ApiQuery({ name: 'limit', required: false, type: Number, example: 50 }),
    ApiQuery({ name: 'offset', required: false, type: Number, example: 0 }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'List of entries with pagination metadata',
    }),
  );

export const ApiFindOneVisionDlq = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get a single visions_dlq entry' }),
    ApiParamRequestId(),
    ApiResponse({ status: HttpStatus.OK, type: VisionDlqResponseDto }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Entry not found',
    }),
  );

export const ApiUpdateVisionDlq = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Update a visions_dlq entry',
      description:
        'Performs a full or partial update. Overwrites specified fields.',
    }),
    ApiParamRequestId(),
    ApiBody({ type: UpdateVisionDlqDto }),
    ApiResponse({ status: HttpStatus.OK, type: VisionDlqResponseDto }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Entry not found',
    }),
  );

export const ApiUpsertVisionDlq = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Upsert a visions_dlq entry',
      description:
        'Inserts a new entry or updates an existing one. Appends failure history and increments attempt counters automatically.',
    }),
    ApiParamRequestId(),
    ApiBody({ type: UpdateVisionDlqDto }),
    ApiResponse({ status: HttpStatus.OK, type: VisionDlqResponseDto }),
    ApiResponse({ status: HttpStatus.CREATED, type: VisionDlqResponseDto }),
  );

export const ApiDeleteVisionDlq = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Delete a visions_dlq entry',
      description:
        'Removes the entry from Postgres. Typically called when a reinserted job succeeds.',
    }),
    ApiParamRequestId(),
    ApiResponse({ status: HttpStatus.OK, type: VisionDlqResponseDto }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Entry not found',
    }),
  );
