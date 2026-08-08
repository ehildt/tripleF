import { Body, Headers, PipeTransform, Query } from '@nestjs/common';

import { MultipartFieldPipe } from '../pipes/multipart-field.pipe.js';
import {
  MultipartFilesPipe,
  MultipartFilesPipeOptions,
} from '../pipes/multipart-files.pipe.js';
import { ParsePromptPipe } from '../pipes/parse-prompt.pipe.js';

import { IMAGES, PROMPT, X_HARNESS_LLM } from './constants.js';

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

export const ImagesField = () =>
  MultiPartFiles({
    fieldName: IMAGES,
    required: false,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
  });
