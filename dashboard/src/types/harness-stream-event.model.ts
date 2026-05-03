export interface HarnessStreamEvent {
  requestId?: string;
  template?: string;
  delta?: string;
  images?: Array<Record<string, string>>;
  toolResults?: Array<{ toolName: string; result: unknown }>;
  done?: boolean;
}
