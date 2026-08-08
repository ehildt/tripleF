import type { ExchangeSection } from '../../helpers/build-exchange-sections.helper.types';

export interface CarouselSectionProps {
  section: ExchangeSection;
  index: number;
  /** 'carousel' renders a full-height crossfading slide; 'native' renders a
   *  variable-height block in the continuous scroll list. */
  mode: 'carousel' | 'native';
  highlightedIds: Set<string>;
  collapsedIds: Set<string>;
}
