import { buildContextSummarySection } from '@triplef/agent/prompts';
import type { VariantName } from '@triplef/agent/schemas';
import type { InputMessage } from '@triplef/ai-sdk';

import type { FastifyMultipartMeta } from '../../dtos/harness-job.dto.js';
import type { HarnessContext } from '../../services/harness-context.type.js';
import { buildFilenames } from '../build-filenames.helper.js';
import type { HistorySelection } from '../respond/build-execution-messages.helper.js';
import { selectStepHistory } from '../select-step-history.helper.js';

import {
  buildImageExecutePrompt,
  buildToolExecutePrompt,
} from './build-execute-prompt.helper.js';

/** Describe the resized image attachments in the execute system prompt. */
function buildImageInventory(
  buffers: Buffer[],
  meta: FastifyMultipartMeta[],
): string {
  if (buffers.length === 0) return '';
  const filenames = buildFilenames(
    meta as Parameters<typeof buildFilenames>[0],
  );
  return `Image attachment(s): ${filenames || '(attached)'}`;
}

/**
 * Build the messages for execute mode — system prompt at index 0, followed
 * by conversation. Downstream steps see the query-focused context the
 * interpret step derived, not the full transcript.
 */
function buildConversationMessages(
  ctx: HarnessContext,
  buffers: Buffer[],
): { messages: InputMessage[]; historySelection: HistorySelection } {
  const fullConversation = ctx.request.messages.filter(
    (m) => m.role !== 'system',
  );
  const selection = selectStepHistory({
    messages: fullConversation,
    template: ctx.outputs.intent?.template,
  });

  const conversation = selection.messages;

  if (buffers.length === 0)
    return {
      messages: conversation,
      historySelection: {
        mode: selection.mode,
        keptCount: selection.messages.length,
        droppedCount: fullConversation.length - selection.messages.length,
      },
    };

  const lastUserIndex = conversation.findLastIndex((m) => m.role === 'user');

  if (lastUserIndex >= 0) {
    const original = conversation[lastUserIndex];
    conversation[lastUserIndex] = {
      ...original,
      images: buffers,
    };
  } else {
    conversation.push({
      role: 'user',
      content: '',
      images: buffers,
    });
  }

  return {
    messages: conversation,
    historySelection: {
      mode: selection.mode,
      keptCount: selection.messages.length,
      droppedCount: fullConversation.length - selection.messages.length,
    },
  };
}

/** Assemble the full execute-mode message list for the tool model call. */
export function buildExecuteMessages(
  ctx: HarnessContext,
  buffers: Buffer[],
  meta: FastifyMultipartMeta[],
  availableVariants: VariantName[],
): { messages: InputMessage[]; historySelection: HistorySelection } {
  const baseSystem = ctx.request.messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n\n');

  const executePrompt =
    buffers.length > 0
      ? buildImageExecutePrompt(
          availableVariants,
          ctx.outputs.intent?.language ?? undefined,
          ctx.outputs.intent?.tools ?? [],
        )
      : buildToolExecutePrompt(ctx.outputs.intent);

  const imageInventory = buildImageInventory(buffers, meta);

  // Downstream steps see the query-focused context summary the interpret step
  // derived, not the full transcript.
  const contextSummary = ctx.outputs.intent?.contextSummary?.trim();
  const contextSection = contextSummary
    ? buildContextSummarySection(contextSummary)
    : '';

  const systemContent = `${baseSystem}\n\n${executePrompt}${
    imageInventory ? `\n\n${imageInventory}` : ''
  }${contextSection ? `\n\n${contextSection}` : ''}`;

  const { messages: conversationMessages, historySelection } =
    buildConversationMessages(ctx, buffers);

  return {
    messages: [
      { role: 'system' as const, content: systemContent },
      ...conversationMessages,
    ],
    historySelection,
  };
}
