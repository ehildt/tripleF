import { type Tool, tool } from 'ai';

import { type FilterVariant } from './image-variant.types.js';
import { variantRequestSchema } from './image-variants.schema.js';

export function createVariantRequestTool(variant: FilterVariant): Tool {
  const descriptions: Record<FilterVariant, string> = {
    grayscale:
      'Request a grayscale version of the images. Use when color noise or color information is irrelevant, for example when reading text or analyzing shapes.',
    denoised:
      'Request a denoised (blurred) version of the images. Use when the original has noise, grain, or artifacts that hide details.',
    sharpened: 'Request a sharpened version of the images. Use when edges or fine details are blurry.',
    clahe:
      'Request a CLAHE (contrast-enhanced) version of the images. Use when details are hidden in shadows or highlights.',
  };

  return tool({
    description: descriptions[variant],
    inputSchema: variantRequestSchema,
    execute: async () => ({ variant }),
  });
}
