import type { SharpOptions } from '../../dtos/sharp-options.dto.js';
import { getVariantPipeline } from '../../helpers/get-variant-pipeline.helper.js';
import type { Variant } from '../../types/image-variant.types.js';
import type { ImageVariantPipeline } from '../image-pipeline-factory.service.types.js';

/** Build a variant pipeline pair for the given variant and parameters. */
export function mapVariantPipeline(
  variant: Variant,
  parameters: Required<SharpOptions>['parameters'],
): ImageVariantPipeline {
  return {
    variant,
    pipeline: getVariantPipeline(variant, parameters),
  };
}
