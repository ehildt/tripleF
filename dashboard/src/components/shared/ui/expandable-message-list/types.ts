export interface MessageListItem {
  id?: string;
  role: string;
  content: string;
  included?: boolean;
  contextPercent?: string;
}
