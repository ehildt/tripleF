import type { MutedToastMessage } from '../toast-settings.types';

/** Return muted history without any entries for the selected message kind. */
export function removeMutedToastMessage(
  messages: MutedToastMessage[],
  key: string,
): MutedToastMessage[] {
  return messages.filter((message) => message.key !== key);
}
