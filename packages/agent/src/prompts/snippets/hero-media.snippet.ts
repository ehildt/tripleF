import { z } from 'zod';

import { safeMediaUrlOrEmpty, safeVideoUrlOrEmpty } from '../../schemas/helpers/url-trust/url-schema.helper.js';

import type { TemplateSnippet } from './snippet.types.js';

/**
 * Hero media: the single lead visual (client header figure). heroVideoUrl
 * implies heroVideoTitle — enforced cross-field on the composed schema.
 */
export const heroMediaSnippet: TemplateSnippet = {
  fields: {
    heroImageUrl: safeMediaUrlOrEmpty(),
    heroImageAlt: z.string().optional(),
    heroCaption: z.string().optional(),
    heroVideoUrl: safeVideoUrlOrEmpty(),
    heroVideoTitle: z.string().optional(),
    heroVideoCaption: z.string().optional(),
  },
  instruction: `SNIPPET hero media (client header figure):
- Needs: one image URL from the image pool, or one video URL from videoSearch or a vetted video link inside web/news results (supported providers only).
- heroVideoUrl wins over heroImageUrl when both exist; when heroVideoUrl is set, heroVideoTitle is REQUIRED and copied verbatim from its availableVideos entry.
- heroImageUrl set ⇒ heroImageAlt MUST be a non-empty descriptive label; heroCaption stays optional.
- Leave empty ONLY when the pools hold no usable media — never invent URLs.`,
};
