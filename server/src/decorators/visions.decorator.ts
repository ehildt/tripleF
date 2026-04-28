import { Body, ParseBoolPipe, PipeTransform, Query } from '@nestjs/common';

import { MultipartFieldPipe } from '../pipes/multipart-field.pipe.js';
import {
  MultipartFilesPipe,
  MultipartFilesPipeOptions,
} from '../pipes/multipart-files.pipe.js';

export const MultiPartFiles = (
  options: MultipartFilesPipeOptions,
  ...pipes: Array<PipeTransform>
) =>
  Body(
    options?.fieldName,
    new MultipartFieldPipe(options.required !== false),
    new MultipartFilesPipe(options),
    ...pipes,
  );

export const MultiPartValue = (field: string, ...pipes: Array<PipeTransform>) =>
  Body(field, new MultipartFieldPipe(), ...pipes);

export const QueryBool = (field: string) =>
  Query(field, new ParseBoolPipe({ optional: true }));

export const QueryNumber = (field: string) => Query(field);
