import { Body, Headers, PipeTransform, Query } from '@nestjs/common';

import { MultipartFieldPipe } from '../pipes/multipart-field.pipe.js';
import {
  MultipartFilesPipe,
  MultipartFilesPipeOptions,
} from '../pipes/multipart-files.pipe.js';
import { ParsePromptPipe } from '../pipes/parse-prompt.pipe.js';

import {
  ATTACHMENTS,
  DOCUMENT_TEXT_LIMIT,
  ORIGINALS,
  PROMPT,
  X_HARNESS_LLM,
} from './constants.js';

const MultiPartFiles = (
  options: MultipartFilesPipeOptions,
  ...pipes: Array<PipeTransform>
) =>
  Body(
    options?.fieldName,
    new MultipartFieldPipe(options.required !== false),
    new MultipartFilesPipe(options),
    ...pipes,
  );

const MultiPartValue = (
  field: string,
  required = true,
  ...pipes: Array<PipeTransform>
) => Body(field, new MultipartFieldPipe(required), ...pipes);

// Convenience decorators for the harness controller

export const HarnessLLMHeader = () => Headers(X_HARNESS_LLM);

export const HarnessStreamQuery = () => Query() as ParameterDecorator;

export const PromptField = () =>
  MultiPartValue(PROMPT, false, new ParsePromptPipe());

export const AttachmentsField = () =>
  MultiPartFiles({
    fieldName: ATTACHMENTS,
    required: false,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
  });

export const OriginalsField = () =>
  MultiPartFiles({
    fieldName: ORIGINALS,
    required: false,
    allowedMimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/markdown',
      'text/csv',
      'application/json',
      'text/xml',
      'application/xml',
      'application/x-yaml',
      'text/yaml',
    ],
  });

export const DocumentTextLimitField = () =>
  MultiPartValue(DOCUMENT_TEXT_LIMIT, false);

export const DocumentHashesField = () => MultiPartValue('hashes', false);
