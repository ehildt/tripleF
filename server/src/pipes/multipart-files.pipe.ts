import type { MultipartFile } from '@fastify/multipart';
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

type Maybe<T> = T | ReadonlyArray<T> | undefined | null;

export type MultipartFilesPipeOptions = {
  fieldName: string;
  required?: boolean;
  minFiles?: number;
  maxFiles?: number;
  allowedMimeTypes?: ReadonlyArray<string>;
};

@Injectable()
export class MultipartFilesPipe implements PipeTransform<
  Maybe<any>,
  ReadonlyArray<MultipartFile>
> {
  constructor(private opt: Readonly<MultipartFilesPipeOptions>) {}

  transform(value: Maybe<any>): ReadonlyArray<MultipartFile> {
    const {
      fieldName,
      required = true,
      minFiles = required ? 1 : 0,
      maxFiles,
      allowedMimeTypes,
    } = this.opt;

    // Normalize input
    const parts = Array.isArray(value) ? value : [value];

    // KEEP ONLY FILE PARTS
    const files = parts.filter((p): p is MultipartFile => p?.type === 'file');

    // Optional field with no files
    if (!required && files.length === 0) return [];

    if (required && files.length === 0)
      throw new BadRequestException(`Missing ${fieldName}`);

    if (files.length < minFiles)
      throw new BadRequestException(
        `Expected at least ${minFiles} file(s) in ${fieldName}`,
      );

    if (maxFiles != null && files.length > maxFiles)
      throw new BadRequestException(
        `Expected at most ${maxFiles} file(s) in ${fieldName}`,
      );

    if (allowedMimeTypes?.length) {
      const allow = new Set(allowedMimeTypes.map((m) => m.toLowerCase()));
      const bad = files.find(
        (f) => !allow.has((f.mimetype ?? '').toLowerCase()),
      );

      if (bad)
        throw new BadRequestException(
          `Invalid file type for ${fieldName}: ${bad.mimetype}`,
        );
    }

    return files;
  }
}
