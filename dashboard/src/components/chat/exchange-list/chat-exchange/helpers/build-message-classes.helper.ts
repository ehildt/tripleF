/**
 * Build the message container class string for a chat exchange.
 *
 * Combines the role-specific background/text alignment, the error
 * status override, the highlight pulse ring, and the shared content
 * typography classes.
 */
export function buildMessageClasses(args: {
  isUser: boolean;
  isError: boolean;
  isHighlighted: boolean;
}): string {
  let roleClass = 'bg-tertiary text-left';
  if (args.isUser) {
    roleClass = 'bg-accent-primary/10 text-right';
  } else if (args.isError) {
    roleClass = 'bg-status-error/5 text-status-error';
  }
  const highlightClass = args.isHighlighted
    ? 'exchange-content__message--highlighted'
    : '';
  return `px-3 py-2 text-sm font-mono content-body ${roleClass} ${highlightClass}`;
}
