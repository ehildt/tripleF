import { Injectable, Logger } from '@nestjs/common';
import sharp, { Sharp } from 'sharp';

import { FastifyMultipartMeta } from '../../harness/dtos/harness-job.dto.js';
import { PreprocessedImage, SharpOptions } from '../dtos/sharp-options.dto.js';
import {
  buildVariantMeta,
  getVariantDescription,
  Variant,
  VariantPipeline,
} from '../helpers/image-variant.helper.js';

@Injectable()
export class ImageVariantProcessor {
  private readonly logger = new Logger(ImageVariantProcessor.name);

  /**
   * Execute a variant pipeline and package the result with metadata.
   */
  async process(
    basePipeline: Sharp,
    meta: FastifyMultipartMeta,
    variant: Variant,
    pipeline: VariantPipeline,
  ): Promise<PreprocessedImage> {
    const processed = pipeline(basePipeline.clone());
    const outputBuffer = await processed.png().toBuffer();

    return {
      buffer: outputBuffer,
      meta: buildVariantMeta(meta, variant),
      variant,
      description: getVariantDescription(variant),
    };
  }

  /**
   * Create a simple original variant with just resize.
   * On failure, returns the raw buffer as a last resort fallback.
   */
  async createOriginal(
    buffer: Buffer,
    meta: FastifyMultipartMeta,
    resize: Required<SharpOptions>['resize'],
  ): Promise<PreprocessedImage> {
    try {
      const processed = await sharp(buffer)
        .resize({
          width: resize.maxWidth ?? undefined,
          height: resize.maxHeight ?? undefined,
          withoutEnlargement: resize.withoutEnlargement,
          fit: 'inside',
        })
        .png()
        .toBuffer();

      return {
        buffer: processed,
        meta: {
          ...meta,
          type: 'image/png',
          variant: 'original',
        },
        variant: 'original',
        description: getVariantDescription('original'),
      };
    } catch (error) {
      this.logger.error(`Failed to process original image:`, error);

      return {
        buffer,
        meta: {
          ...meta,
          variant: 'original',
        },
        variant: 'original',
        description: getVariantDescription('original'),
      };
    }
  }
}
