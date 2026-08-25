import { buildBaseSystemPrompt } from '@triplef/agent/prompts';
import type { InputMessage } from '@triplef/ai-sdk';

import { normalizeThink } from '../../ai-sdk/helpers/normalize-think.helper.js';
import type { HarnessJobPayload } from '../dtos/harness-job.dto.js';

import type { DocumentSection } from './documents/document-section.types.js';
import { parseSessionMetadata } from './json/parse-session-metadata.helper.js';
import { injectDocumentsMessage } from './inject-documents-message.helper.js';

export function buildChatRequest(
  buffers: Buffer[],
  filenames: string,
  filters: HarnessJobPayload['filters'],
  keepAlive: string,
  variantDescriptions?: string[],
  visionExclusionNotice?: string,
  documentSections: DocumentSection[] = [],
) {
  const hasImages = buffers.length > 0;

  const baseSystem = buildBaseSystemPrompt({ hasImages });
  const systemContent = `${baseSystem}${
    visionExclusionNotice ? `\n\n${visionExclusionNotice}` : ''
  }`;

  const systemPrompt = systemContent
    ? {
        role: 'system' as const,
        content: systemContent,
      }
    : undefined;

  const variants = variantDescriptions
    ?.map((desc, index) => `${index + 1}. ${desc}`)
    .join('\n');

  const imageAttachmentMessage: InputMessage | undefined = hasImages
    ? {
        role: 'system' as const,
        content: !variants?.length
          ? `Image attachment(s):\n${filenames || '(attached)'}`
          : `Image attachment(s):\n${filenames || '(attached)'}\n${variants}`,
      }
    : undefined;

  const prompts = ((filters.prompt ?? []) as InputMessage[]).filter(
    (p): p is InputMessage =>
      p != null &&
      typeof p.role === 'string' &&
      typeof p.content === 'string' &&
      (p.content.trim().length > 0 || (p.images?.length ?? 0) > 0),
  );

  // Attach uploaded images to the latest user prompt so they travel as part
  // of the actual user turn, not as a separate hardcoded instruction message.
  if (hasImages && buffers.length > 0) {
    const lastUserIndex = prompts.findLastIndex((m) => m.role === 'user');
    if (lastUserIndex >= 0) {
      prompts[lastUserIndex] = {
        ...prompts[lastUserIndex],
        images: buffers,
      };
    } else {
      prompts.push({
        role: 'user' as const,
        content: '',
        images: buffers,
      });
    }
  }

  const messages = injectDocumentsMessage(
    [
      ...(systemPrompt ? [systemPrompt] : []),
      ...(imageAttachmentMessage ? [imageAttachmentMessage] : []),
      ...prompts,
    ].filter((m): m is NonNullable<typeof m> => m != null),
    documentSections,
  );

  // Merge request: the client consolidated selected exchanges into one user
  // message and carried their request ids through sessionMetadata. Append the
  // consolidation directive so the response model produces ONE unified
  // answer — same-topic material collapses into merged sections, unrelated
  // topics stay distinct and are explicitly labeled as separate.
  const sessionMetadata = parseSessionMetadata(filters.sessionMetadata);
  const mergeFromRequestIds = sessionMetadata?.merge?.fromRequestIds;
  if (mergeFromRequestIds?.length) {
    messages.push({
      role: 'system' as const,
      content: buildMergeDirective(mergeFromRequestIds),
    });
  }

  return {
    messages,
    options: { num_ctx: filters.numCtx },
    stream: filters.stream,
    model: filters.model!,
    keep_alive: keepAlive,
    think: normalizeThink(filters.think),
  };
}

/**
 * Model-facing consolidation directive for a merge submit (never localized:
 * the model reads it, not the user). It anchors the merge template's
 * contract: take the snippets from the selected answers and build NEW
 * enriched snippets — one consolidated video/image gallery and sources list,
 * every comparison rendered as its own mergedEvaluations block, the merged
 * narrative in a single bodySections array (one structured block per topic,
 * each with its own hero media) — with the special user request rendered as
 * its own block at the end. The embedded assistant answers carry their full
 * structured JSON, so every snippet field can be merged with complete
 * fidelity.
 */
function buildMergeDirective(fromRequestIds: string[]): string {
  return `MERGE REQUEST

The user combined the following previous requests into a single request: ${fromRequestIds.join(', ')}.
Produce ONE response using the merge template: take the snippets from the combined answers and build NEW enriched snippets from them.

- Merge all video lists from the combined answers into ONE consolidated video gallery; merge all image galleries into ONE consolidated image gallery; merge all source lists into ONE consolidated sources list; merge all key findings into one key findings list.
- Render EVERY comparison or critique from the combined answers as its own block in mergedEvaluations (one per match-up): its own subjects, its own comparison matrix (never mix subjects of unrelated pairings into one comparison), its own reasoning, and its own recommendations.
- Merge the narrative of the selected answers into ONE bodySections array — one block per topic: topic (concise heading), the topic's own hero media (heroImageUrl/heroImageAlt/heroCaption or heroVideoUrl/heroVideoTitle/heroVideoCaption — heroVideoTitle REQUIRED with a heroVideoUrl; a merge has no single hero, never emit response-level hero fields), strengths (the topic's pros), weaknesses (its cons), recommendations, and content (plain text only when the material is not list-shaped). Same-topic material merges into one block, deduplicating repeat points; unrelated pieces stay in separate blocks with an explicit note and are still rendered. Keep ALL their texts and URLs. A topic's hero media must not be repeated in the galleries or sources.
- EVERY selected prompt counts the same: consolidate each selected answer with equal depth and completeness — never lead with the first selection and compress the rest.
- Answer the special user request from the ADDITIONAL INSTRUCTION at the end of the merged message with its own snippet(s) at the END of all merged snippets.
- This is a merge, NOT a recap or summary of the material — reproduce the consolidated content itself.`;
}
