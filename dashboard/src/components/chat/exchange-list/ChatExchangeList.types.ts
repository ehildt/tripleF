export interface ChatExchangeListProps {
  compact?: boolean;
  retryHandler: (text: string) => Promise<void>;
}
