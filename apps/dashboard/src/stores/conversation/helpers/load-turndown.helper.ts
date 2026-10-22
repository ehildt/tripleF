import type TurndownService from 'turndown';

let turndownPromise: Promise<TurndownService> | null = null;

/**
 * Lazily create the shared TurndownService instance. The module import is
 * deferred: turndown is only needed when a prompt is built (submit time), so
 * loading it eagerly would put its bytes on the boot critical path for
 * nothing. Memoized — the instance is created once and reused.
 */
export function loadTurndown(): Promise<TurndownService> {
  if (!turndownPromise) {
    turndownPromise = import('turndown').then(
      ({ default: TurndownService }) => {
        return new TurndownService({
          headingStyle: 'atx',
          codeBlockStyle: 'fenced',
        });
      },
    );
  }
  return turndownPromise;
}
