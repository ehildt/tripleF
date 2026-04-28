import {
  isNodeBuffer,
  isSerializedBuffer,
  SerializedBuffer,
} from '@ehildt/ckir-helpers/is-buffer-or-serialized';
import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';

import {
  mergePreprocessingOptions,
  VARIANT_DESCRIPTIONS,
} from '../constants/image-preprocessing.constants.js';
import { FastifyMultipartMeta } from '../dtos/classic/get-fastify-multipart-data-req.dto.js';
import {
  ImagePreprocessingOptions,
  PreprocessedImage,
} from '../dtos/image-preprocessing-options.dto.js';

@Injectable()
export class ImagePreprocessingService {
  private readonly logger = new Logger(ImagePreprocessingService.name);

  /**
   * Convert serialized Buffer objects back to real Buffer instances
   * BullMQ serializes Buffers to { type: 'Buffer', data: [...] } when storing in Redis
   */
  private ensureBuffer(buffer: Buffer | SerializedBuffer): Buffer {
    if (isNodeBuffer(buffer)) return buffer;
    if (isSerializedBuffer(buffer)) return Buffer.from(buffer.data);
    throw new Error('Invalid buffer format');
  }

  /**
   * Preprocess images by creating multiple variants for better AI analysis
   * @param buffers Original image buffers
   * @param meta Original image metadata
   * @param options Preprocessing options
   * @returns Array of preprocessed images with metadata
   */
  async preprocessImages(
    buffers: Buffer[],
    meta: FastifyMultipartMeta[],
    options?: ImagePreprocessingOptions,
  ): Promise<PreprocessedImage[]> {
    const realBuffers = buffers.map((b) => this.ensureBuffer(b));
    const mergedOptions = mergePreprocessingOptions(options);

    if (!mergedOptions.enabled)
      return this.processOriginalsOnly(realBuffers, meta, mergedOptions);

    const results: PreprocessedImage[] = [];

    // Process each input image
    for (let i = 0; i < realBuffers.length; i++) {
      const buffer = realBuffers[i];
      const originalMeta = meta[i];

      try {
        const variants = await this.createVariants(
          buffer,
          originalMeta,
          mergedOptions,
        );
        results.push(...variants);
      } catch (error) {
        this.logger.error(
          `Failed to preprocess image ${originalMeta.name}:`,
          error,
        );
        // Fall back to original if processing fails
        results.push(
          await this.createOriginalVariant(buffer, originalMeta, mergedOptions),
        );
      }
    }

    return results;
  }

  /**
   * Process images with only resize (when preprocessing is disabled)
   */
  private async processOriginalsOnly(
    buffers: Buffer[],
    meta: FastifyMultipartMeta[],
    options: Required<ImagePreprocessingOptions>,
  ): Promise<PreprocessedImage[]> {
    const results: PreprocessedImage[] = [];

    for (let i = 0; i < buffers.length; i++) {
      results.push(
        await this.createOriginalVariant(buffers[i], meta[i], options),
      );
    }

    return results;
  }

  /**
   * Create all enabled variants for a single image
   */
  private async createVariants(
    buffer: Buffer,
    meta: FastifyMultipartMeta,
    options: Required<ImagePreprocessingOptions>,
  ): Promise<PreprocessedImage[]> {
    const { variants: variantOptions, parameters, resize } = options;
    const basePipeline = sharp(buffer).resize({
      width: resize.maxWidth ?? undefined,
      height: resize.maxHeight ?? undefined,
      withoutEnlargement: resize.withoutEnlargement,
      fit: 'inside',
    });

    const variantPromises: Promise<PreprocessedImage>[] = [];

    if (variantOptions.original) {
      variantPromises.push(
        this.processVariant(
          basePipeline.clone(),
          meta,
          'original',
          (pipeline) => pipeline,
        ),
      );
    }

    if (variantOptions.grayscale) {
      variantPromises.push(
        this.processVariant(
          basePipeline.clone(),
          meta,
          'grayscale',
          (pipeline) => pipeline.grayscale(),
        ),
      );
    }

    if (variantOptions.denoised) {
      variantPromises.push(
        this.processVariant(
          basePipeline.clone(),
          meta,
          'denoised',
          (pipeline) => pipeline.grayscale().blur(parameters.blurSigma),
        ),
      );
    }

    if (variantOptions.sharpened) {
      variantPromises.push(
        this.processVariant(
          basePipeline.clone(),
          meta,
          'sharpened',
          (pipeline) =>
            pipeline.sharpen({
              sigma: parameters.sharpenSigma ?? 1,
              m1: parameters.sharpenM1 ?? 1,
              m2: parameters.sharpenM2 ?? 2,
            }),
        ),
      );
    }

    if (variantOptions.clahe) {
      variantPromises.push(
        this.processVariant(basePipeline.clone(), meta, 'clahe', (pipeline) =>
          pipeline.grayscale().clahe({
            width: parameters.claheWidth ?? 8,
            height: parameters.claheHeight ?? 8,
            maxSlope: parameters.claheMaxSlope ?? 3,
          }),
        ),
      );
    }

    const results = await Promise.all(variantPromises);
    return results.filter((r): r is PreprocessedImage => r !== null);
  }

  /**
   * Process a single variant
   */
  private async processVariant(
    pipeline: sharp.Sharp,
    meta: FastifyMultipartMeta,
    variant: string,
    processor: (pipeline: sharp.Sharp) => sharp.Sharp,
  ): Promise<PreprocessedImage> {
    const processed = processor(pipeline);
    const outputBuffer = await processed.png().toBuffer();

    const fileExt = meta.name.split('.').pop() || 'png';
    const baseName = meta.name.replace(/\.[^/.]+$/, '');

    return {
      buffer: outputBuffer,
      meta: {
        name: `${baseName}_${variant}.${fileExt}`,
        type: meta.type,
        hash: meta.hash + `_${variant}`,
        variant,
      },
      variant,
      description: VARIANT_DESCRIPTIONS[variant] || variant,
    };
  }

  /**
   * Create a simple original variant with just resize
   */
  private async createOriginalVariant(
    buffer: Buffer,
    meta: FastifyMultipartMeta,
    options: Required<ImagePreprocessingOptions>,
  ): Promise<PreprocessedImage> {
    try {
      const { resize } = options;
      const processed = await sharp(buffer)
        .resize({
          width: resize.maxWidth ?? undefined,
          height: resize.maxHeight ?? undefined,
          withoutEnlargement: resize.withoutEnlargement,
          fit: 'inside',
        })
        .toBuffer();

      return {
        buffer: processed,
        meta: {
          ...meta,
          variant: 'original',
        },
        variant: 'original',
        description: VARIANT_DESCRIPTIONS.original,
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
        description: VARIANT_DESCRIPTIONS.original,
      };
    }
  }
}
