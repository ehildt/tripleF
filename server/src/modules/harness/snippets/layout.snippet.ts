import {
  RESPONSE_LAYOUTS,
  type ResponseLayout,
} from './response-layout.constant.js';

const LAYOUT_DESCRIPTIONS: Record<ResponseLayout, string> = {
  classic:
    '"classic": stacked flow — full-width hero under the header, sections top to bottom. The safe default.',
  editorial:
    '"editorial": pull-quote magazine spread — body prose beside an enlarged pull quote. Only when you write a non-empty quote.',
  split:
    '"split": 50/50 hero split — the hero media panel sits beside the header stack. Only when heroImageUrl or heroVideoUrl is set.',
  mosaic:
    '"mosaic": dense mosaic gallery — the image gallery becomes a packed grid. Only with at least 3 galleryItems.',
};

/**
 * Layout snippet instruction: the model picks the response's arrangement as
 * the very first JSON key, choosing from the layouts enabled for this
 * request (preset-supported ∩ user-enabled). Preconditions bind the choice
 * to content the model controls, so the picked layout always has substance.
 */
export function buildLayoutInstruction(allowed: ResponseLayout[]): string {
  const usable = allowed.length > 0 ? allowed : ['classic'];
  const fallback = usable.includes('classic') ? 'classic' : usable[0];
  const lines = usable
    .filter((layout): layout is ResponseLayout =>
      (RESPONSE_LAYOUTS as readonly string[]).includes(layout),
    )
    .map((layout) => `- ${LAYOUT_DESCRIPTIONS[layout]}`);
  return `SNIPPET layout (client section arrangement — ALWAYS the first key):
- layout: one of ${usable.map((layout) => `"${layout}"`).join(', ')}. Every layout rearranges the sections below into a different client template composition.
${lines.join('\n')}
- Pick only a layout whose precondition your content satisfies; when no precondition holds, pick "${fallback}".`;
}
