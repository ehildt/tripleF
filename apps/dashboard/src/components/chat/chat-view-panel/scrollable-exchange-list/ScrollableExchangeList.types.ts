import type { ExchangeSection } from '../helpers/build-exchange-sections.helper.types';

export interface ScrollableExchangeListProps {
  sections: readonly ExchangeSection[];
  mode: 'carousel' | 'native';
  highlightedIds: Set<string>;
  collapsedIds: Set<string>;
  isCompact: boolean;
  activeAssistantExchangeId: string | null;
  activeAssistantResponseStarted: boolean;
}
