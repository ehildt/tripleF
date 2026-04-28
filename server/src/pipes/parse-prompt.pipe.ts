import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { Prompt } from '../dtos/prompt.dto.js';

type Maybe<T> = T | ReadonlyArray<T> | undefined | null;

@Injectable()
export class ParsePromptPipe implements PipeTransform {
  async transform(
    value: Maybe<any>,
    metadata: ArgumentMetadata,
  ): Promise<Array<Prompt>> {
    const parts = Array.isArray(value) ? value : [value];
    const field = parts.find(
      (p) => p?.type === 'field' && p?.fieldname === metadata.data,
    );

    if (!field?.value) return [];

    let parsed: Array<Prompt>;
    try {
      parsed = JSON.parse(field.value);
    } catch {
      return [];
    }

    const instances = plainToInstance(Prompt, parsed);
    const errors = (
      await Promise.all(
        instances.map((inst) => validate(inst, { whitelist: true })),
      )
    ).flat();

    if (errors.length) {
      const messages = errors
        .map((e) =>
          e.constraints
            ? `${e.property}: ${Object.values(e.constraints).join(', ')}`
            : e.property,
        )
        .join('; ');
      throw new BadRequestException(`Validation failed: ${messages}`);
    }

    return instances;
  }
}
