import type { Ref } from 'vue';

export interface CarouselScrollState {
  scrollTop: Ref<number>;
  viewportHeight: Ref<number>;
  activeSectionIndex: Ref<number>;
  previousActiveSectionIndex: Ref<number>;
  forceTopOnNextTransition: Ref<boolean>;
  scrollToSection: (index: number, smooth?: boolean) => void;
}
