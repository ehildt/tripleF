import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

import type { Maybe } from './maybe.types.js';

/**
 * Parses the multipart `hashes` field into a string array. Absent/empty →
 * undefined; malformed JSON or a non-string-array shape is rejected at the
 * boundary instead of being silently filtered downstream.
 */
@Injectable()
export class ParseHashesPipe implements PipeTransform {
  transform(
    value: Maybe<any>,
    metadata: ArgumentMetadata,
  ): string[] | undefined {
    const parts = Array.isArray(value) ? value : [value];
    const field = parts.find(
      (p) => p?.type === 'field' && p?.fieldname === metadata.data,
    );
    if (!field?.value) return undefined;

    let parsed: unknown;
    try {
      parsed = JSON.parse(field.value);
    } catch {
      throw new BadRequestException('hashes must be a JSON array of strings');
    }
    if (!Array.isArray(parsed) || !parsed.every((h) => typeof h === 'string')) {
      throw new BadRequestException('hashes must be a JSON array of strings');
    }
    return parsed;
  }
}
