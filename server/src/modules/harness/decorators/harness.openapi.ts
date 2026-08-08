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
  CancelHarnessJobDto,
  CancelHarnessJobResponseDto,
} from '../dtos/cancel-harness-job.dto.js';
import { HarnessControllerResponse } from '../dtos/harness-response.dto.js';
import { HarnessStreamQueryDto } from '../dtos/harness-stream-query.dto.js';
import { WarmModelDto, WarmModelResponseDto } from '../dtos/warm-model.dto.js';

import {
  EVENT,
  NUM_CTX,
  REQUEST_ID,
  ROOM_ID,
  STREAM,
  X_HARNESS_LLM,
} from './constants.js';

const ApiQueryStream = () =>
  ApiQuery({
    type: Boolean,
    required: false,
    name: STREAM,
    default: 'false',
    description: `**Response mode**

When enabled, the server streams partial results as they become available.
When disabled, a single aggregated response is returned after processing completes.`,
  });

const ApiQueryRoomId = () =>
  ApiQuery({
    name: ROOM_ID,
    type: String,
    required: false,
    example: 'a1b2c3',
    description: `**Socket.IO routing key**

Identifies the Socket.IO room used to emit asynchronous results.
Allows responses to be routed to a specific client or group.`,
  });

const ApiQueryRequestId = () =>
  ApiQuery({
    name: REQUEST_ID,
    type: String,
    required: false,
    example: '1234',
    description: `**Request correlation identifier**

Client-provided identifier for correlating request and response.
Returned in the response realtime info for client-side tracking.`,
  });

const ApiQueryEvent = () =>
  ApiQuery({
    name: EVENT,
    type: String,
    required: false,
    example: 'harness',
    description: `**Socket.IO event name**

Specifies the Socket.IO event name for receiving real-time results.
Default: \`harness\``,
  });

const ApiQueryNumCtx = () =>
  ApiQuery({
    name: NUM_CTX,
    required: false,
    type: Number,
    example: '32000',
    description: `**Model context size**

Defines the maximum token context available to the model.
Higher values increase memory usage and resource consumption.`,
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
          description: `**Prompt**

Provides textual guidance to the model for performing the harness task.
Can refine or constrain the output, for example by specifying level of detail or focus areas.`,
        },
        images: {
          type: 'array',
          description: `**Image inputs**

One or more image files submitted for analysis.
Images must be provided as multipart form-data.`,
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
    description: `**Model selector**

Specifies the LLM used to process the request.
Supported models are configured and managed by the system administrator.`,
  });

export const ApiHarness = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Run a harness job',
      description: `Accepts images via multipart form-data and queues a harness job.
Results are emitted asynchronously via Socket.IO.`,
    }),
    ApiExtraModels(HarnessStreamQueryDto),
    ApiHeaderXHarnessLLM(),
    ApiConsumes('multipart/form-data'),
    ApiResponse({
      status: HttpStatus.ACCEPTED,
      description: `**Asynchronous processing**

The request has been accepted and queued for processing.
Results are emitted asynchronously via Socket.IO.`,
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
      description: `Returns all models currently available on the connected Ollama instance.

**Conditional requests**

The response carries a strong \`ETag\` covering the full payload. Send it back
as \`If-None-Match\` to receive \`304 Not Modified\` (empty body) when the
catalog has not changed.`,
    }),
    ApiHeader({
      name: 'If-None-Match',
      required: false,
      description:
        'ETag from a previous response; 304 when the catalog is unchanged',
    }),
    ApiResponse({ status: HttpStatus.OK, description: 'List of models' }),
    ApiResponse({
      status: HttpStatus.NOT_MODIFIED,
      description: 'Catalog unchanged',
    }),
  );

export const ApiCancelJob = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Cancel a pending or active harness job',
      description: `**Job cancellation**

Cancels a harness job identified by its requestId.
If the job is pending, it is removed from the queue.
If the job is active, it will stop processing and emit a canceled status.
If the job is already completed or failed, the cancel has no effect.`,
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

export const ApiWarmModel = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Warm up a model in Ollama',
      description: `**Model warm-up**

Pre-loads a model's weights in Ollama (fire-and-forget) so the first real
prompt does not stall on a cold load. The call returns immediately; the
warm-up runs in the background and failures are logged, not surfaced.`,
    }),
    ApiBody({
      type: WarmModelDto,
      description: 'The model to warm up',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Warm-up accepted',
      type: WarmModelResponseDto,
    }),
  );
