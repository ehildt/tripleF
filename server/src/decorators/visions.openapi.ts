import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiHeader,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';

import { PREPROCESSING_SIZES } from '../constants/image-preprocessing.constants.js';
import { CancelJobDto, CancelJobResponseDto } from '../dtos/cancel-job.dto.js';
import { ClassicControllerResponse } from '../dtos/classic/classic-response.dto.js';
import { VisionTask } from '../dtos/classic/get-fastify-multipart-data-req.dto.js';

import {
  EVENT,
  NUM_CTX,
  REQUEST_ID,
  ROOM_ID,
  STREAM,
  X_VISION_LLM,
} from './constants.js';

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
    example: 'vision',
    description: [
      '**Socket.IO event name**',
      '',
      'Specifies the Socket.IO event name for receiving real-time results.',
      'Default: `vision`',
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
        task: {
          type: 'string',
          example: 'describe',
          enum: ['describe', 'compare', 'ocr'] satisfies Array<VisionTask>,
          description: [
            '**Vision task**',
            '',
            'Determines the operation performed on the submitted images.',
            'Examples include description, comparison, and optical character recognition.',
          ].join('\n'),
        },
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
            'Provides textual guidance to the model for performing the vision task.',
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

const ApiHeaderXVisionLLM = () =>
  ApiHeader({
    name: X_VISION_LLM,
    required: true,
    schema: {
      type: 'string',
      example: 'ministral-3:14b',
    },
    description: [
      '**Vision model selector**',
      '',
      'Specifies the vision-capable LLM used to process the request.',
      'Supported models are configured and managed by the system administrator.',
    ].join('\n'),
  });

// Preprocessing query param decorators
const ApiQueryPprocEnabled = () =>
  ApiQuery({
    name: 'pproc_enabled',
    type: Boolean,
    required: false,
    default: false,
    description: [
      '**Enable image preprocessing**',
      '',
      'When enabled, creates multiple image variants for enhanced AI analysis.',
      'Requires images to be processed with Sharp library.',
    ].join('\n'),
  });

const ApiQueryPprocOriginal = () =>
  ApiQuery({
    name: 'pproc_original',
    type: Boolean,
    required: false,
    default: true,
    description: '[Variant] Include resized original image',
  });

const ApiQueryPprocGrayscale = () =>
  ApiQuery({
    name: 'pproc_grayscale',
    type: Boolean,
    required: false,
    default: true,
    description: '[Variant] Grayscale - removes color for luminance focus',
  });

const ApiQueryPprocDenoised = () =>
  ApiQuery({
    name: 'pproc_denoised',
    type: Boolean,
    required: false,
    default: true,
    description: '[Variant] Denoised - Gaussian blur for background smoothing',
  });

const ApiQueryPprocSharpened = () =>
  ApiQuery({
    name: 'pproc_sharpened',
    type: Boolean,
    required: false,
    default: false,
    description: '[Variant] Sharpened - edge enhancement for clarity',
  });

const ApiQueryPprocClahe = () =>
  ApiQuery({
    name: 'pproc_clahe',
    type: Boolean,
    required: false,
    default: true,
    description: '[Variant] CLAHE - adaptive contrast enhancement',
  });

const ApiQueryPprocResizeMaxWidth = () =>
  ApiQuery({
    name: 'pproc_resize_maxWidth',
    type: Number,
    required: false,
    default: 768,
    enum: PREPROCESSING_SIZES,
    description: '[Resize] Maximum width in pixels',
  });

const ApiQueryPprocResizeMaxHeight = () =>
  ApiQuery({
    name: 'pproc_resize_maxHeight',
    type: Number,
    required: false,
    default: null,
    description:
      '[Resize] Maximum height in pixels (keeps aspect ratio if not set)',
  });

const ApiQueryPprocResizeWithoutEnlargement = () =>
  ApiQuery({
    name: 'pproc_resize_withoutEnlargement',
    type: Boolean,
    required: false,
    default: true,
    description: '[Resize] Prevent upscaling images smaller than target',
  });

const ApiQueryPprocBlurSigma = () =>
  ApiQuery({
    name: 'pproc_blurSigma',
    type: Number,
    required: false,
    default: 0.5,
    description: '[Param] Gaussian blur sigma for denoising',
  });

const ApiQueryPprocSharpenSigma = () =>
  ApiQuery({
    name: 'pproc_sharpenSigma',
    type: Number,
    required: false,
    default: 1,
    description: '[Param] Sharpen sigma value',
  });

const ApiQueryPprocSharpenM1 = () =>
  ApiQuery({
    name: 'pproc_sharpenM1',
    type: Number,
    required: false,
    default: 1,
    description: '[Param] Sharpen flat area level',
  });

const ApiQueryPprocSharpenM2 = () =>
  ApiQuery({
    name: 'pproc_sharpenM2',
    type: Number,
    required: false,
    default: 2,
    description: '[Param] Sharpen jagged area level',
  });

const ApiQueryPprocBrightnessLevel = () =>
  ApiQuery({
    name: 'pproc_brightnessLevel',
    type: Number,
    required: false,
    default: 1.2,
    description: '[Param] Brightness multiplier',
  });

const ApiQueryPprocClaheWidth = () =>
  ApiQuery({
    name: 'pproc_claheWidth',
    type: Number,
    required: false,
    default: 8,
    description: '[Param] CLAHE tile width',
  });

const ApiQueryPprocClaheHeight = () =>
  ApiQuery({
    name: 'pproc_claheHeight',
    type: Number,
    required: false,
    default: 8,
    description: '[Param] CLAHE tile height',
  });

const ApiQueryPprocClaheMaxSlope = () =>
  ApiQuery({
    name: 'pproc_claheMaxSlope',
    type: Number,
    required: false,
    default: 3,
    description: '[Param] CLAHE max slope/contrast limit',
  });

const ApiQueryPprocNormalizeLower = () =>
  ApiQuery({
    name: 'pproc_normalizeLower',
    type: Number,
    required: false,
    default: 1,
    description: '[Param] Normalization lower percentile',
  });

const ApiQueryPprocNormalizeUpper = () =>
  ApiQuery({
    name: 'pproc_normalizeUpper',
    type: Number,
    required: false,
    default: 99,
    description: '[Param] Normalization upper percentile',
  });

export const ApiVision = () =>
  applyDecorators(
    ApiHeaderXVisionLLM(),
    ApiConsumes('multipart/form-data'),
    ApiResponse({
      status: HttpStatus.ACCEPTED,
      description: [
        '**Asynchronous processing**',
        '',
        'The request has been accepted and queued for processing.',
        'Results are emitted asynchronously via Socket.IO.',
      ].join('\n'),
      type: ClassicControllerResponse,
    }),
    ApiBodySchema(),
    ApiQueryRoomId(),
    ApiQueryRequestId(),
    ApiQueryEvent(),
    ApiQueryStream(),
    ApiQueryNumCtx(),
    // Preprocessing query params
    ApiQueryPprocEnabled(),
    ApiQueryPprocOriginal(),
    ApiQueryPprocGrayscale(),
    ApiQueryPprocDenoised(),
    ApiQueryPprocSharpened(),
    ApiQueryPprocClahe(),
    ApiQueryPprocResizeMaxWidth(),
    ApiQueryPprocResizeMaxHeight(),
    ApiQueryPprocResizeWithoutEnlargement(),
    ApiQueryPprocBlurSigma(),
    ApiQueryPprocSharpenSigma(),
    ApiQueryPprocSharpenM1(),
    ApiQueryPprocSharpenM2(),
    ApiQueryPprocBrightnessLevel(),
    ApiQueryPprocClaheWidth(),
    ApiQueryPprocClaheHeight(),
    ApiQueryPprocClaheMaxSlope(),
    ApiQueryPprocNormalizeLower(),
    ApiQueryPprocNormalizeUpper(),
  );

export const ApiCancelJob = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Cancel a pending or active vision job',
      description: [
        '**Job cancellation**',
        '',
        'Cancels a vision job identified by its requestId.',
        'If the job is pending, it is removed from the queue.',
        'If the job is active, it will stop processing and emit a canceled status.',
        'If the job is already completed or failed, the cancel has no effect.',
      ].join('\n'),
    }),
    ApiBody({
      type: CancelJobDto,
      description: 'The cancel request containing the requestId to cancel',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Job cancel status',
      type: CancelJobResponseDto,
    }),
  );
