import { Injectable, Logger } from '@nestjs/common';

import { FastifyMultipartMeta } from '../../harness/dtos/harness-job.dto.js';
import { SharpConfigService } from '../configs/sharp-config.service.js';
import { mergeSharpOptions } from '../constants/sharp.constants.js';
import { PreprocessedImage, SharpOptions } from '../dtos/sharp-options.dto.js';
import { getVariantPipeline } from '../helpers/get-variant-pipeline.helper.js';
import { toBuffer } from '../helpers/image-buffer.helper.js';
import {
  type FilterVariant,
  type Variant,
} from '../types/image-variant.types.js';

import { ImagePipelineFactory } from './image-pipeline-factory.service.js';
import { ImageVariantProcessor } from './image-variant-processor.service.js';
import { SharpOverridesService } from './sharp-overrides.service.js';

@Injectable()
export class SharpService {
  private readonly logger = new Logger(SharpService.name);

  constructor(
    private readonly configService: SharpConfigService,
    private readonly sharpOverrides: SharpOverridesService,
    private readonly pipelineFactory: ImagePipelineFactory,
    private readonly variantProcessor: ImageVariantProcessor,
  ) {}

  /**
   * Preprocessing options from the effective server-side config (env
   * defaults + live overrides). Returns undefined when disabled.
   */
  buildOptions(): SharpOptions | undefined {
    return this.sharpOverrides.buildOptions();
  }

  /**
   * Resize images to the configured maximum dimensions.
   * Always runs, regardless of the preprocessing enabled flag.
   */
  async resizeImages(
    buffers: Buffer[],
    meta: FastifyMultipartMeta[],
    options?: SharpOptions,
  ): Promise<PreprocessedImage[]> {
    const realBuffers = buffers.map((b) => toBuffer(b));
    const mergedOptions = mergeSharpOptions(
      options,
      this.configService.defaults,
    );

    const results: PreprocessedImage[] = [];

    for (let i = 0; i < realBuffers.length; i++) {
      results.push(
        await this.variantProcessor.createOriginal(
          realBuffers[i],
          meta[i],
          mergedOptions.resize,
        ),
      );
    }

    return results;
  }

  /**
   * Generate only the requested filter variants for each image.
   */
  async generateVariants(
    buffers: Buffer[],
    meta: FastifyMultipartMeta[],
    variants: FilterVariant[],
    options?: SharpOptions,
  ): Promise<PreprocessedImage[]> {
    if (variants.length === 0) return [];

    const realBuffers = buffers.map((b) => toBuffer(b));
    const mergedOptions = mergeSharpOptions(
      options,
      this.configService.defaults,
    );

    const results: PreprocessedImage[] = [];

    for (let i = 0; i < realBuffers.length; i++) {
      try {
        const basePipeline = this.pipelineFactory.createBasePipeline(
          realBuffers[i],
          mergedOptions.resize,
        );

        const variantPipelines = variants.map((variant) => ({
          variant,
          pipeline: getVariantPipeline(variant, mergedOptions.parameters),
        }));

        const imageVariants = await Promise.all(
          variantPipelines.map(({ variant, pipeline }) =>
            this.variantProcessor.process(
              basePipeline,
              meta[i],
              variant as Variant,
              pipeline,
            ),
          ),
        );

        results.push(...imageVariants);
      } catch (error) {
        this.logger.error(
          `Failed to generate variants for image ${meta[i].name}:`,
          error,
        );
      }
    }

    return results;
  }

  /**
   * Preprocess images by creating multiple variants for better AI analysis.
   * @param buffers Original image buffers
   * @param meta Original image metadata
   * @param options Preprocessing options
   * @returns Array of preprocessed images with metadata
   */
  async preprocessImages(
    buffers: Buffer[],
    meta: FastifyMultipartMeta[],
    options?: SharpOptions,
  ): Promise<PreprocessedImage[]> {
    const realBuffers = buffers.map((b) => toBuffer(b));
    const mergedOptions = mergeSharpOptions(
      options,
      this.configService.defaults,
    );

    if (!mergedOptions.enabled) {
      return this.processOriginalsOnly(realBuffers, meta, mergedOptions);
    }

    const results: PreprocessedImage[] = [];

    for (let i = 0; i < realBuffers.length; i++) {
      const buffer = realBuffers[i];
      const originalMeta = meta[i];

      try {
        const variants = await this.createAllVariants(
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
          await this.variantProcessor.createOriginal(
            buffer,
            originalMeta,
            mergedOptions.resize,
          ),
        );
      }
    }

    return results;
  }

  /**
   * Process images with only resize (when preprocessing is disabled).
   */
  private async processOriginalsOnly(
    buffers: Buffer[],
    meta: FastifyMultipartMeta[],
    options: Required<SharpOptions>,
  ): Promise<PreprocessedImage[]> {
    const results: PreprocessedImage[] = [];

    for (let i = 0; i < buffers.length; i++) {
      results.push(
        await this.variantProcessor.createOriginal(
          buffers[i],
          meta[i],
          options.resize,
        ),
      );
    }

    return results;
  }

  /**
   * Create all enabled variants for a single image.
   */
  private async createAllVariants(
    buffer: Buffer,
    meta: FastifyMultipartMeta,
    options: Required<SharpOptions>,
  ): Promise<PreprocessedImage[]> {
    const basePipeline = this.pipelineFactory.createBasePipeline(
      buffer,
      options.resize,
    );
    const variantPipelines =
      this.pipelineFactory.buildVariantPipelines(options);

    const variantPromises = variantPipelines.map(({ variant, pipeline }) =>
      this.variantProcessor.process(basePipeline, meta, variant, pipeline),
    );

    return Promise.all(variantPromises);
  }
}
