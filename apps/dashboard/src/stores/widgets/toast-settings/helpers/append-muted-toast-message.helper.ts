import type { MutedToastMessage } from '../toast-settings.types';

/** Append a muted message kind once, returning the original array for duplicates. */
export function appendMutedToastMessage(
  messages: MutedToastMessage[],
  key: string,
  sample: string,
): MutedToastMessage[] {
  if (messages.some((message) => message.key === key)) return messages;
  return [...messages, { key, sample }];
}
