export interface MessageListItem {
  role: string;
  content: string;
  included?: boolean;
  contextPercent?: string;
}
