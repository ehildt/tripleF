import {
  buildBaseSystemPrompt,
  buildMergeDirective,
} from '@triplef/agent/prompts';
import type { InputMessage } from '@triplef/ai-sdk';

import { normalizeThink } from '../../ollama/helpers/normalize-think.helper.js';
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
