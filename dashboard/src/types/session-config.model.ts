export interface SessionConfig {
  sessionId: string;
  selectedModel?: string | null;
  preprocessing?: Record<string, unknown> | null;
  providerOverrides?: Record<string, unknown> | null;
}
