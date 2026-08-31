import type { Exchange } from '../../conversation.model';
import { toPromptMessage } from './to-prompt-message.helper';
import { withTemplateMarker } from './with-template-marker.helper';

/** Convert an exchange into a turndown message for the model. */
export function mapExchangeToMessage(
  e: Exchange,
  turndown: { turndown: (html: string) => string },
) {
  const message = toPromptMessage(e, { includeTemplateMarker: false });
  return {
    role: message.role,
    // The classifier marker survives only outside turndown: brackets
    // would be escaped and the newline collapsed to a space.
    content: withTemplateMarker(
      turndown.turndown(message.content),
      e.harnessTemplate,
    ),
  };
}
