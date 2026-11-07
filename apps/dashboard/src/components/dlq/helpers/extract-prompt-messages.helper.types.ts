export interface DlqPromptMessage {
  /** Conversation roles persisted in the harness prompt history. */
  role: 'user' | 'assistant';
  /** Model-facing text recovered from the failed job payload. */
  content: string;
}
