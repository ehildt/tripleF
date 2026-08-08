import type { MessageContainerVariant } from '../types/message-container-variant.model';
import type { BuildMessageClassesArgs } from './build-message-classes.helper.types';

/**
 * Build the message container class string for a chat exchange.
 *
 * Returns a BEM-aware class list describing the role variant, the error
 * status override, and the highlight pulse; the styles live in
 * ExchangeContent's scoped style block (the message container lives in its
 * template, and the markdown typography is scoped to the components that
 * render it). `content-body` is the semantic hook class the light mode
 * uses for its code-block color overrides — keep it or light-mode prose
 * breaks.
 */
export function buildMessageClasses(args: BuildMessageClassesArgs): string {
  let variant: MessageContainerVariant = 'assistant';
  if (args.isUser) {
    variant = 'user';
  } else if (args.isError) {
    variant = 'error';
  }
  const roleClass = `exchange-message--${variant}`;
  const highlightClass = args.isHighlighted
    ? 'exchange-message--highlighted'
    : '';
  return `exchange-message ${roleClass} content-body ${highlightClass}`.trim();
}
