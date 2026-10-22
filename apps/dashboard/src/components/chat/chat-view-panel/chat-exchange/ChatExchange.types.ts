import type { Exchange } from '@/stores/conversation/conversation.model';

export interface ChatExchangeProps {
  exchange: Exchange;
  highlighted?: boolean;
  collapsed?: boolean;
}
