import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';

import { HARNESS_QUEUE } from '../../bullmq/constants/bullmq.constants.js';
import { CreateDlqEntryDto, STATUSES } from '../dtos/create-dlq-entry.dto.js';
import { DlqEntryResponseDto } from '../dtos/dlq-entry-response.dto.js';
import { ReinstateDlqDto } from '../dtos/reinstate-dlq.dto.js';
import { UpdateDlqEntryDto } from '../dtos/update-dlq-entry.dto.js';

const ApiParamRequestId = () =>
  ApiParam({
    name: 'requestId',
    required: true,
    type: String,
    description: 'The requestId (primary key) of the harness_dlq entry',
  });

export const ApiCreateDlqEntry = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Create a new harness_dlq entry',
      description:
        'Persists a failed BullMQ job into Postgres for later reinsertion.',
    }),
    ApiBody({ type: CreateDlqEntryDto }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Entry created successfully',
      type: DlqEntryResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Validation error',
    }),
  );

export const ApiFindAllDlqEntries = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Query harness_dlq entries',
      description:
        'Paginated query with optional filters by status, queueName, nextRetryAt range, and requestId.',
    }),
    ApiQuery({ name: 'status', required: false, type: String, enum: STATUSES }),
    ApiQuery({
      name: 'queueName',
      required: false,
      type: String,
      enum: [HARNESS_QUEUE],
    }),
    ApiQuery({ name: 'requestId', required: false, type: String }),
    ApiQuery({ name: 'limit', required: false, type: Number, example: 50 }),
    ApiQuery({ name: 'offset', required: false, type: Number, example: 0 }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'List of entries with pagination metadata',
    }),
  );

export const ApiFindOneDlqEntry = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get a single harness_dlq entry' }),
    ApiParamRequestId(),
    ApiResponse({ status: HttpStatus.OK, type: DlqEntryResponseDto }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Entry not found',
    }),
  );

export const ApiUpdateDlqEntry = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Update a harness_dlq entry',
      description:
        'Performs a full or partial update. Overwrites specified fields.',
    }),
    ApiParamRequestId(),
    ApiBody({ type: UpdateDlqEntryDto }),
    ApiResponse({ status: HttpStatus.OK, type: DlqEntryResponseDto }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Entry not found',
    }),
  );

export const ApiUpsertDlqEntry = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Upsert a harness_dlq entry',
      description:
        'Inserts a new entry or updates an existing one. Appends failure history and increments attempt counters automatically.',
    }),
    ApiParamRequestId(),
    ApiBody({ type: UpdateDlqEntryDto }),
    ApiResponse({ status: HttpStatus.OK, type: DlqEntryResponseDto }),
    ApiResponse({ status: HttpStatus.CREATED, type: DlqEntryResponseDto }),
  );

export const ApiDeleteDlqEntry = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Delete a harness_dlq entry',
      description:
        'Removes the entry from Postgres. Typically called when a reinserted job succeeds.',
    }),
    ApiParamRequestId(),
    ApiResponse({ status: HttpStatus.OK, type: DlqEntryResponseDto }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Entry not found',
    }),
  );

export const ApiReinstateDlqEntries = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Reinstate DLQ entries into BullMQ for retry',
      description:
        'Accepts an optional body with requestIds, or a batchSize query param. Re-enqueues matching Failed or Cleared entries into their respective queues.',
    }),
    ApiQuery({
      name: 'batchSize',
      required: false,
      type: Number,
      description: 'Number of jobs to reinstate when batching by time',
      example: 10,
    }),
    ApiBody({ type: ReinstateDlqDto, required: false }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Reinstatement result',
      schema: {
        type: 'object',
        properties: {
          restored: { type: 'number' },
          requestIds: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
    }),
  );
