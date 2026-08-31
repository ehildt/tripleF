import { z, type ZodType } from 'zod';

import { HERO_VIDEO_TITLE_ISSUE, heroVideoHasTitle } from '../../../schemas/response/video-gallery-item-json.schema.js';
import { responseLayoutSchema } from '../response-layout.constant.js';
import type { SnippetTemplatePreset } from '../snippet.types.js';

/**
 * Merge a preset's snippet field fragments into one zod object schema.
 * `layout` leads the shape so the streaming model emits it first; the hero
 * video cross-field rule applies to every preset (all carry hero media).
 */
export function composeSnippetSchema(preset: SnippetTemplatePreset): ZodType {
  const shape = Object.assign(
    { layout: responseLayoutSchema },
    ...preset.snippets.map((snippet) => snippet.fields),
  ) as Record<string, z.ZodTypeAny>;
  return z.object(shape).refine(heroVideoHasTitle, HERO_VIDEO_TITLE_ISSUE);
}
