export interface MessageListItem {
  /** The message's role (user/assistant/system/…). */
  role: string;
  /** The message body. */
  content: string;
}

export interface ExpandableMessageListProps {
  /** The messages payload: pre-parsed items, or a raw list/record to parse. */
  items?: string | MessageListItem[] | Record<string, unknown> | null;
  /** Optional markdown renderer used for message bodies. */
  renderHtml?: (content: string) => string;
  /** Called with the index when a message is clicked. */
  onClick?: (index: number) => void;
  /** Start with every message expanded. */
  expandAll?: boolean;
}

export interface ExpandableMessageListItemProps {
  /** The message to render. */
  message: MessageListItem;
  /** Whether this message is expanded. */
  expanded: boolean;
  /** Whether the message has a body slot to expand. */
  hasBody: boolean;
  /** Optional markdown renderer (forwarded to the body). */
  renderHtml?: (content: string) => string;
}

export interface ExpandableMessageListItemEmits {
  /** Expand/collapse the message. */
  toggle: [];
  /** Select the message. */
  select: [];
}

export interface ExpandableMessageListBodyProps {
  /** Pre-rendered HTML body. */
  html: string;
}

export interface ExpandableMessageListToggleProps {
  /** Whether the message is expanded. */
  expanded: boolean;
  /** The message role (drives the role badge/tone). */
  role: string;
  /** The message body (preview is plain-text, HTML stripped). */
  content: string;
  /** Whether the message has a body to expand. */
  hasBody: boolean;
  /** Optional markdown renderer for the preview. */
  renderHtml?: (content: string) => string;
}

export interface ExpandableMessageListToggleEmits {
  /** Expand/collapse the message. */
  toggle: [];
  /** Select the message. */
  select: [];
}
