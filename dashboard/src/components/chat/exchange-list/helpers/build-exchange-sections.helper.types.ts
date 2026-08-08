import type { Exchange } from '@/stores/conversation';

export interface ExchangeSection {
  id: string;
  user?: Exchange;
  assistants: Exchange[];
}
