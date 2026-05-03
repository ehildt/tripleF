import { SocketIOService } from '@ehildt/nestjs-socket.io';
import { Job } from 'bullmq';

import type { InputMessage } from '../../ai-sdk/helpers/ai-sdk-message.models.js';
import { normalizeThink } from '../../ai-sdk/helpers/ollama.helpers.js';
import { HarnessJobPayload } from '../dtos/harness-job.dto.js';
import { buildBaseSystemPrompt } from '../prompts/base-system.prompt.js';

export function isCompactTask(job: Job<HarnessJobPayload>): boolean {
  return job.data.filters.compact === true;
}

export function buildVisionExclusionNotice(
  model: string,
  meta: HarnessJobPayload['meta'],
): string {
  if (meta.length === 0) return '';
  const names = meta.map((entry) => entry.name).join(', ');
  return [
    `The user attached ${meta.length} image(s) (${names}), but the selected model "${model}" does not support vision.`,
    'Exclude the image(s) from your analysis and answer based only on the text prompt(s).',
    "Respond in the same language as the user's last message.",
  ].join(' ');
}

export function stripImagesFromMessages(
  messages: InputMessage[],
): InputMessage[] {
  return messages.map((message) =>
    message.images?.length ? { ...message, images: undefined } : message,
  );
}

export function buildChatRequest(
  buffers: Buffer[],
  filenames: string,
  filters: HarnessJobPayload['filters'],
  keepAlive: string,
  variantDescriptions?: string[],
  visionExclusionNotice?: string,
) {
  const hasImages = buffers.length > 0;

  const baseSystem = buildBaseSystemPrompt({ hasImages });
  const systemContent = [baseSystem, visionExclusionNotice]
    .filter(Boolean)
    .join('\n\n');

  const systemPrompt = {
    role: 'system' as const,
    content: systemContent,
  };

  const variants = variantDescriptions
    ?.map((desc, index) => `${index + 1}. ${desc}`)
    .join('\n');

  const userMessage = {
    role: 'user' as const,
    images: buffers,
    content: hasImages
      ? !variants?.length
        ? `Image(s):\n${filenames}`
        : ['Image(s):', filenames, variants].join('\n')
      : '',
  };

  const prompts = (filters.prompt ?? []).filter(
    (p): p is InputMessage =>
      p != null &&
      typeof p.role === 'string' &&
      typeof p.content === 'string' &&
      p.content.trim().length > 0,
  );

  const messages: InputMessage[] = [
    systemPrompt,
    ...prompts,
    ...(hasImages ? [userMessage] : []),
  ].filter((m): m is NonNullable<typeof m> => m != null);

  return {
    messages,
    options: { num_ctx: filters.numCtx },
    stream: filters.stream,
    model: filters.model!,
    keep_alive: keepAlive,
    think: normalizeThink(filters.think),
  };
}

export function buildGalleryItems(
  sessionId: string | undefined,
  conversationId: string | undefined,
  meta: HarnessJobPayload['meta'],
): Array<Record<string, string>> {
  return meta
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => !entry?.variant || entry.variant === 'original')
    .map(({ entry }) => {
      const name = entry?.name ?? 'image';
      const hash = entry?.hash ?? '';
      const imageUrl =
        sessionId && conversationId
          ? `/api/v1/storage/${sessionId}/${conversationId}/${hash}`
          : '';

      return {
        imageUrl,
        imageAlt: name,
        title: name,
        caption: name,
      };
    });
}

export function extractImageCountFromToolResults(
  toolResults: Array<{ toolName: string; result: unknown }>,
): number {
  let count = 0;
  for (const tr of toolResults ?? []) {
    if (!tr.toolName.endsWith('ImageSearch')) continue;
    const data = tr.result as
      { results?: Array<{ imageUrl?: string }> } | undefined;
    count += data?.results?.length ?? 0;
  }
  return count;
}

export function extractVideoCountFromToolResults(
  toolResults: Array<{ toolName: string; result: unknown }>,
): number {
  let count = 0;
  for (const tr of toolResults ?? []) {
    if (!tr.toolName.endsWith('VideoSearch')) continue;
    const data = tr.result as { results?: Array<unknown> } | undefined;
    count += data?.results?.length ?? 0;
  }
  return count;
}

export async function emitToSocket(
  io: SocketIOService,
  roomId: string | undefined,
  event: string | undefined,
  data: unknown,
): Promise<void> {
  const socketEvent = event ?? 'harness';
  try {
    const payload = { event: socketEvent, ...(data as object) };
    if (roomId) io.emitTo(socketEvent, roomId, payload);
    else io.emit(socketEvent, payload);
  } catch {
    // intentional
  }
}
