import { Injectable } from '@nestjs/common';
import sharp, { Sharp } from 'sharp';

import { SharpOptions } from '../dtos/sharp-options.dto.js';
import { getEnabledVariants } from '../helpers/get-enabled-variants.helper.js';

import { mapVariantPipeline } from './helpers/map-variant-pipeline.helper.js';
import type { ImageVariantPipeline } from './image-pipeline-factory.service.types.js';

@Injectable()
export class ImagePipelineFactory {
  /**
   * Create the base resize pipeline for an image.
   */
  createBasePipeline(
    buffer: Buffer,
    resize: Required<SharpOptions>['resize'],
  ): Sharp {
    return sharp(buffer).resize({
      width: resize.maxWidth ?? undefined,
      height: resize.maxHeight ?? undefined,
      withoutEnlargement: resize.withoutEnlargement,
      fit: 'inside',
    });
  }

  /**
   * Return all enabled variant pipelines for the given options.
   */
  buildVariantPipelines(
    options: Required<SharpOptions>,
  ): ImageVariantPipeline[] {
    const variants = getEnabledVariants(options.variants);

    return variants.map((variant) =>
      mapVariantPipeline(variant, options.parameters),
    );
  }
}
