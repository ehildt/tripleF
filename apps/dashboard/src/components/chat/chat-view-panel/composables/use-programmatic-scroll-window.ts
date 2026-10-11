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

/** True while a programmatic scroll is in flight. Module-scope on purpose:
 *  every scroller that arms the window and every consumer that reads it must
 *  share one window — only one scroll container (carousel or native) is
 *  rendered at a time, so a single window is the correct, unambiguous source
 *  of truth. */
const isProgrammaticScroll = ref(false);

/**
 * Tracks whether observed scroll events belong to a programmatic scroll the
 * caller triggered itself. The window opens on `armProgrammaticScroll` and
 * closes on the scroller's `scrollend` event via `endProgrammaticScroll` —
 * no timers. Callers must not arm when the scroll position will not change,
 * because browsers do not dispatch `scrollend` for a no-op scroll.
 */
export function useProgrammaticScrollWindow(): ProgrammaticScrollWindow {
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
