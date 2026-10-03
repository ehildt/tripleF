import { type Ref, ref } from 'vue';

export interface ProgrammaticScrollWindow {
  /** True while a programmatic scroll is in flight. */
  isProgrammaticScroll: Ref<boolean>;
  /** Mark the start of a programmatic scroll. */
  armProgrammaticScroll: () => void;
  /** Close the window when the scroller reports its scroll has completed. */
  endProgrammaticScroll: () => void;
  /** Reset the window (no pending timers; used for lifecycle hygiene). */
  disposeProgrammaticScrollWindow: () => void;
}

/**
 * Tracks whether observed scroll events belong to a programmatic scroll the
 * caller triggered itself. The window opens on `armProgrammaticScroll` and
 * closes on the scroller's `scrollend` event via `endProgrammaticScroll` —
 * no timers. Callers must not arm when the scroll position will not change,
 * because browsers do not dispatch `scrollend` for a no-op scroll.
 */
export function useProgrammaticScrollWindow(): ProgrammaticScrollWindow {
  const isProgrammaticScroll = ref(false);

  function armProgrammaticScroll() {
    isProgrammaticScroll.value = true;
  }

  function endProgrammaticScroll() {
    isProgrammaticScroll.value = false;
  }

  function disposeProgrammaticScrollWindow() {
    isProgrammaticScroll.value = false;
  }

  return {
    isProgrammaticScroll,
    armProgrammaticScroll,
    endProgrammaticScroll,
    disposeProgrammaticScrollWindow,
  };
}
