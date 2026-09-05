import { type VariantName } from '../../../schemas/helpers/tools/tool-registry.constants.js';

import { buildExecuteLanguageInstruction } from './execute-language.helper.js';

const IMAGE_TASK_QUERY_GUIDANCE = `QUERY CRAFTING (image task) — phrase each tool query for its endpoint; never copy one query across tools:
- Identify the subject first: read the visible signals (on-screen text, logos, watermarks, characters, outfits, UI elements) and use the filenames in the image inventory as hints. Filenames are hints, never verbatim queries.
- *WebSearch: short factual identification queries — start with the broad subject name (e.g. "Stellar Blade Eve"), then narrow with the visible clues in later calls. Use them to confirm the subject and find authoritative pages.
- *ImageSearch: a short standalone visual description of the subject for reference images (e.g. "Stellar Blade Eve nano suit official art"). 3–10 words, no questions, no full sentences.
- If the subject stays genuinely unknown after inspecting the image(s), call the tools with your best visual descriptor anyway — never with the user's verbatim message.
- Emit EVERY selected tool call in ONE response as parallel tool calls. A selected tool that is never called is a failure.`;

/**
 * Fan-out guidance for image tasks: identification improves with multiple
 * differently phrased visual queries, and every enabled search provider
 * contributes a distinct candidate set for the evidence-selection step that
 * follows. Queries must progress from GRANULAR (broad subject) to SPECIFIC
 * (narrow clues): a narrow-only set backfires when the specific guess is
 * wrong, because the broad query is what surfaces the subject's name.
 */
const IMAGE_TASK_FANOUT_RULES = `FAN-OUT — image identification needs broader coverage than a single query per tool:
- Order queries from GRANULAR to SPECIFIC: the FIRST query names the broadest plausible subject (e.g. "Stellar Blade Eve"), and each later query narrows it with the visible clues (outfit, colors, scene, UI elements, character). Never emit only narrow queries — a broad first query is what surfaces the subject when the image is ambiguous, and a narrow-only set backfires when the specific guess is wrong.
- Call EVERY selected *WebSearch tool at least once and use it for GENERAL coverage: start with the broad identification query (subject name, optionally with a category), then a more specific corroboration query. The web search is not limited to the narrowest guess — it confirms the subject and finds authoritative pages.
- Call EVERY selected *ImageSearch tool at least once, one call per enabled provider (e.g. serperImageSearch and brightDataImageSearch) — providers return different result sets, and the respond step later selects from every candidate by search-result evidence, so extra candidates are simply not picked, never harmful.
- Call each *ImageSearch tool 2–4 times: the broad subject query first, then progressively more specific visual descriptors (character or outfit, distinctive feature, official art / key visual). More than 4 is waste.
- Call EVERY selected *VideoSearch tool at least once with the subject plus a video type (e.g. "Stellar Blade trailer", "Stellar Blade gameplay") — videos feed the response's video gallery.
- When an explicit imageCount/videoCount is set, split the total evenly across the parallel calls so their sum equals the target — never pass the full count to each call. When no count is set, omit count entirely and let each tool use its default.`;

/**
 * Build the system prompt for image execution tasks. Instructs the model to choose preprocessing variants and external tools.
 */
export function buildImageExecutePrompt(
  availableVariants: VariantName[],
  language?: string,
  mandatoryTools: string[] = [],
): string {
  const variantLine =
    availableVariants.length > 0
      ? `Available image variants you may request: ${availableVariants.join(', ')}.`
      : 'No additional image variants are available.';

  // request* tools are preprocessing-variant requests, never mandatory calls.
  const externalTools = mandatoryTools.filter((t) => !t.startsWith('request'));
  const toolLine =
    externalTools.length > 0
      ? `MANDATORY tools you MUST call (each at least once, in ONE response as parallel tool calls): ${externalTools.join(', ')}. A selected tool that is never called is a failure.`
      : 'No external tools are selected for this task.';

  const langInstruction = buildExecuteLanguageInstruction(language);

  return `You are selecting preprocessing variants and optional external tools for an image task.
The resized image(s) are attached to the latest user message.
${variantLine}
${langInstruction ? `${langInstruction}\n` : ''}Your job in this step is NOT to answer the user. It is only to inspect the attached image(s) and decide which tools or variants are needed.
${toolLine}
${IMAGE_TASK_QUERY_GUIDANCE}
${IMAGE_TASK_FANOUT_RULES}
Only request image variants if they would materially improve your analysis.
Do NOT write a final answer, explanation, or conclusion in this step.
FINAL REMINDER:
- Inspect the image(s), emit every selected tool call at once, and request variants if useful. Return ONLY tool calls and variant requests; no prose answer.`;
}
