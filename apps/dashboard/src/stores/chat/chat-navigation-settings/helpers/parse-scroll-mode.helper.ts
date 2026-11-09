import type { ScrollMode } from '../chat-navigation-settings.model';

/** Parse the persisted scroll mode, defaulting to the carousel. */
export function parseScrollMode(saved: string | null): ScrollMode {
  return saved === 'native' ? 'native' : 'carousel';
}
