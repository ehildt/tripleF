import type { Exchange } from '@/stores/chat/conversation/conversation.model';

export interface ChatExchangeProps {
  exchange: Exchange;
  highlighted?: boolean;
  collapsed?: boolean;
}
