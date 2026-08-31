import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

import type { Maybe } from './maybe.types.js';

/**
 * Parses the multipart `documentTextLimit` field into a non-negative integer
 * (0 = uncapped). Absent/empty → undefined; anything else that is not a
 * non-negative integer is rejected at the boundary instead of being silently
 * coerced downstream.
 */
@Injectable()
export class ParseDocumentTextLimitPipe implements PipeTransform {
  transform(value: Maybe<any>, metadata: ArgumentMetadata): number | undefined {
    const parts = Array.isArray(value) ? value : [value];
    const field = parts.find(
      (p) => p?.type === 'field' && p?.fieldname === metadata.data,
    );
    if (!field?.value) return undefined;

    const parsed = Number(field.value);
    if (!Number.isInteger(parsed) || parsed < 0) {
      throw new BadRequestException(
        'documentTextLimit must be a non-negative integer',
      );
    }
    return parsed;
  }
}
