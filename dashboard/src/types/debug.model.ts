export interface DebugResult {
  id: string;
  timestamp: string;
  epoch?: number;
  endpoint: string;
  method: string;
  status: 'success' | 'error';
  statusCode?: number;
  errorMessage?: string;
  responseTime: number;
  type: 'http' | 'socket';
  direction?: 'request' | 'response';
  requestHeaders?: Record<string, string>;
  requestBody?: string;
  responseBody?: string;
  requestId?: string;
  roomId?: string;
  event?: string;
  numCtx?: string;
  stream?: boolean;
  model?: string;
  prompt?: string;
  conversationId?: string;
  preprocessing?: string;
  promptEvalCount?: number;
  evalCount?: number;
  evalDuration?: number;
  totalDuration?: number;
}
