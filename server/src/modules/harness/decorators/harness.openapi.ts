import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiExtraModels,
  ApiHeader,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';

import {
  EVENT,
  NUM_CTX,
  REQUEST_ID,
  ROOM_ID,
  STREAM,
  X_HARNESS_LLM,
} from '../decorators/constants.js';
import {
  CancelHarnessJobDto,
  CancelHarnessJobResponseDto,
} from '../dtos/cancel-harness-job.dto.js';
import { HarnessControllerResponse } from '../dtos/harness-response.dto.js';
import { HarnessStreamQueryDto } from '../dtos/harness-stream-query.dto.js';

const ApiQueryStream = () =>
  ApiQuery({
    type: Boolean,
    required: false,
    name: STREAM,
    default: 'false',
    description: [
      '**Response mode**',
      '',
      'When enabled, the server streams partial results as they become available.',
      'When disabled, a single aggregated response is returned after processing completes.',
    ].join('\n'),
  });

const ApiQueryRoomId = () =>
  ApiQuery({
    name: ROOM_ID,
    type: String,
    required: false,
    example: 'a1b2c3',
    description: [
      '**Socket.IO routing key**',
      '',
      'Identifies the Socket.IO room used to emit asynchronous results.',
      'Allows responses to be routed to a specific client or group.',
    ].join('\n'),
  });

const ApiQueryRequestId = () =>
  ApiQuery({
    name: REQUEST_ID,
    type: String,
    required: false,
    example: '1234',
    description: [
      '**Request correlation identifier**',
      '',
      'Client-provided identifier for correlating request and response.',
      'Returned in the response realtime info for client-side tracking.',
    ].join('\n'),
  });

const ApiQueryEvent = () =>
  ApiQuery({
    name: EVENT,
    type: String,
    required: false,
    example: 'harness',
    description: [
      '**Socket.IO event name**',
      '',
      'Specifies the Socket.IO event name for receiving real-time results.',
      'Default: `harness`',
    ].join('\n'),
  });

const ApiQueryNumCtx = () =>
  ApiQuery({
    name: NUM_CTX,
    required: false,
    type: Number,
    example: '32000',
    description: [
      '**Model context size**',
      '',
      'Defines the maximum token context available to the model.',
      'Higher values increase memory usage and resource consumption.',
    ].join('\n'),
  });

const ApiBodySchema = () =>
  ApiBody({
    schema: {
      type: 'object',
      properties: {
        prompt: {
          type: 'object',
          required: ['role', 'content'],
          example: [
            {
              role: 'user',
              content: 'Describe this image in exhaustive visual detail',
            },
          ],
          properties: {
            role: {
              type: 'string',
              example: 'user',
              enum: ['user', 'tool', 'assistant'],
              description: '**The prompt role**',
            },
            content: {
              type: 'string',
              description: '**The prompt content**',
            },
          },
          description: [
            '**Prompt**',
            '',
            'Provides textual guidance to the model for performing the harness task.',
            'Can refine or constrain the output, for example by specifying level of detail or focus areas.',
          ].join('\n'),
        },
        images: {
          type: 'array',
          description: [
            '**Image inputs**',
            '',
            'One or more image files submitted for analysis.',
            'Images must be provided as multipart form-data.',
          ].join('\n'),
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  });

const ApiHeaderXHarnessLLM = () =>
  ApiHeader({
    name: X_HARNESS_LLM,
    required: true,
    schema: {
      type: 'string',
      example: 'ministral-3:14b',
    },
    description: [
      '**Model selector**',
      '',
      'Specifies the LLM used to process the request.',
      'Supported models are configured and managed by the system administrator.',
    ].join('\n'),
  });

export const ApiHarness = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Run a harness job',
      description: [
        'Accepts images via multipart form-data and queues a harness job.',
        'Results are emitted asynchronously via Socket.IO.',
      ].join('\n'),
    }),
    ApiExtraModels(HarnessStreamQueryDto),
    ApiHeaderXHarnessLLM(),
    ApiConsumes('multipart/form-data'),
    ApiResponse({
      status: HttpStatus.ACCEPTED,
      description: [
        '**Asynchronous processing**',
        '',
        'The request has been accepted and queued for processing.',
        'Results are emitted asynchronously via Socket.IO.',
      ].join('\n'),
      type: HarnessControllerResponse,
    }),
    ApiBodySchema(),
    ApiQueryRoomId(),
    ApiQueryRequestId(),
    ApiQueryEvent(),
    ApiQueryStream(),
    ApiQueryNumCtx(),
  );

export const ApiGetModels = () =>
  applyDecorators(
    ApiOperation({
      summary: 'List available Ollama models',
      description:
        'Returns all models currently available on the connected Ollama instance.',
    }),
    ApiResponse({ status: HttpStatus.OK, description: 'List of models' }),
  );

export const ApiCancelJob = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Cancel a pending or active harness job',
      description: [
        '**Job cancellation**',
        '',
        'Cancels a harness job identified by its requestId.',
        'If the job is pending, it is removed from the queue.',
        'If the job is active, it will stop processing and emit a canceled status.',
        'If the job is already completed or failed, the cancel has no effect.',
      ].join('\n'),
    }),
    ApiBody({
      type: CancelHarnessJobDto,
      description: 'The cancel request containing the requestId to cancel',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Job cancel status',
      type: CancelHarnessJobResponseDto,
    }),
  );
