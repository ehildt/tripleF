import type { Ref } from 'vue';

export interface ExchangeVisualState {
  hoveredDeleteId: Ref<string | null>;
  highlightedIds: Ref<Set<string>>;
  collapsedIds: Ref<Set<string>>;
  onHoverDeleteStart: (exchangeId: string) => void;
  onHoverDeleteEnd: () => void;
}
