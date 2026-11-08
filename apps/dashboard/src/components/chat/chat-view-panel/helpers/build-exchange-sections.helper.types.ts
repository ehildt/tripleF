import type { Exchange } from '@/stores/chat/conversation/conversation.model';

export interface ExchangeSection {
  id: string;
  user?: Exchange;
  assistants: Exchange[];
}
