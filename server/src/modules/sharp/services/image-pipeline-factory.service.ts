import { Injectable } from '@nestjs/common';
import sharp, { Sharp } from 'sharp';

import { SharpOptions } from '../dtos/sharp-options.dto.js';
import {
  getEnabledVariants,
  getVariantPipeline,
  Variant,
  VariantPipeline,
} from '../helpers/image-variant.helper.js';

export interface ImageVariantPipeline {
  variant: Variant;
  pipeline: VariantPipeline;
}

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

    return variants.map((variant) => ({
      variant,
      pipeline: getVariantPipeline(variant, options.parameters),
    }));
  }
}
