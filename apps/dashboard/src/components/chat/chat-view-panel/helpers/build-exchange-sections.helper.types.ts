import type { Exchange } from '@/stores/conversation/conversation.model';

export interface ExchangeSection {
  id: string;
  user?: Exchange;
  assistants: Exchange[];
}
