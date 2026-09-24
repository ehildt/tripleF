export interface ChatViewPanelProps {
  compact?: boolean;
  retryHandler: (text: string) => Promise<void>;
}
