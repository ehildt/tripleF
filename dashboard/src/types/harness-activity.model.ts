/**
 * A structured activity descriptor sent by the server while a reply is being
 * prepared. The server never sends a human-readable sentence — only a stable
 * i18n key (under `activity.*`) plus non-translatable meta such as a search
 * query or a tool name. The client localizes the label in the language the
 * model chose to respond in.
 */
export interface HarnessActivityDescriptor {
  key: string;
  meta?: Record<string, unknown>;
}
