import type {
  Conversation,
  Exchange,
} from '@/stores/conversation/conversation.model';
import { createConversation } from '@/stores/conversation/helpers/create-conversation.helper';
import { inferConversationTitle } from '@/stores/conversation/helpers/infer-conversation-title.helper';
import type { DlqEntry } from '@/types/dlq-entry.model';
import { createId } from '@/utils/create-id/create-id.helper';

import { extractEntryFilters } from './extract-entry-filters.helper';
import { extractPromptMessages } from './extract-prompt-messages.helper';

/**
 * Recover a temporary conversation from the prompt history persisted on a
 * harness DLQ entry. Historical request ids and timestamps are not present
 * in the job payload, so only the failed turn receives its original request
 * id and all recovered exchanges receive fresh local ids/timestamps.
 */
export function buildRecoveredConversation(entry: DlqEntry): Conversation {
  const filters = extractEntryFilters(entry);
  const messages = extractPromptMessages(entry);
  const failedPromptIndex = messages
    .map((message) => message.role === 'user')
    .lastIndexOf(true);

  if (failedPromptIndex < 0)
    throw new Error(`DLQ entry ${entry.id} has no user prompt to recover`);

  const startedAt = Date.now();
  const exchanges: Exchange[] = messages.map((message, index) => ({
    id: createId(),
    role: message.role,
    content: message.content,
    ...(index === failedPromptIndex ? { requestId: entry.jobName } : {}),
    status: 'done',
    timestamp: startedAt + index,
    model: filters.model,
    event: filters.event,
    roomId: filters.roomId,
    conversationId: filters.conversationId,
  }));

  const conversation = createConversation({
    conversationId: filters.conversationId,
    model: filters.model,
    ...(filters.numCtx !== undefined ? { numCtx: filters.numCtx } : {}),
    ...(filters.think !== undefined ? { think: filters.think } : {}),
    event: filters.event,
    roomId: filters.roomId,
    ...(filters.stream !== undefined ? { stream: filters.stream } : {}),
    subscriptions: [{ event: filters.event, roomId: filters.roomId }],
    type: 'temporary',
  });
  const firstUserPrompt = messages.find((message) => message.role === 'user');
  conversation.title = inferConversationTitle(
    conversation.title,
    firstUserPrompt?.content ?? '',
  );
  conversation.exchanges = exchanges;
  return conversation;
}
