import type { Exchange } from '@/stores/conversation';

export interface ChatExchangeProps {
  exchange: Exchange;
  highlighted?: boolean;
  collapsed?: boolean;
}
