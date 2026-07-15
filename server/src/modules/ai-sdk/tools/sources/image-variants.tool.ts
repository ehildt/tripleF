import { tool } from 'ai';
import { z } from 'zod';

import { type FilterVariant } from '../../../sharp/types/image-variant.types.js';

export function createVariantRequestTool(variant: FilterVariant) {
  const descriptions: Record<FilterVariant, string> = {
    grayscale:
      'Request a grayscale version of the images. Use when color noise or color information is irrelevant, for example when reading text or analyzing shapes.',
    denoised:
      'Request a denoised (blurred) version of the images. Use when the original has noise, grain, or artifacts that hide details.',
    sharpened:
      'Request a sharpened version of the images. Use when edges or fine details are blurry.',
    clahe:
      'Request a CLAHE (contrast-enhanced) version of the images. Use when details are hidden in shadows or highlights.',
  };

  return tool({
    description: descriptions[variant],
    inputSchema: z.object({}),
    execute: async () => ({ variant }),
  });
}
