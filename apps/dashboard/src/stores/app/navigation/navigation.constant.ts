/** localStorage key for optional tab visibility overrides. */
export const TAB_VISIBILITY_KEY = 'harness-tab-visibility';

/** localStorage key for the persisted chat-response star toggle. */
export const STAR_KEY = 'harness-chat-star';

/** localStorage key for whether navigation counters are shown. */
export const SHOW_COUNTERS_KEY = 'harness-show-counters';

/**
 * Tabs hidden unless explicitly enabled: debug starts disabled, so the
 * user opts in via Settings. `dlq` (dead letter) is on by default; `sockets`
 * (the chat toolbar sockets menu) is off by default. `http`/`settings` are
 * core.
 */
export const DEFAULT_TAB_VISIBILITY: Record<string, boolean> = {
  chat: true,
  memory: true,
  dlq: true,
  debug: false,
  sockets: false,
  settings: true,
};
