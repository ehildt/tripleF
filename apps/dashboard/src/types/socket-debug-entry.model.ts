export interface SocketDebugEntry {
  endpoint: string;
  method: string;
  status: 'success' | 'error';
  statusCode?: number;
  errorMessage?: string;
  responseTime: number;
  type: 'http' | 'socket';
  direction: 'request' | 'response';
  requestId?: string;
  roomId?: string;
  event?: string;
  stream?: boolean;
  conversationId?: string;
  promptEvalCount?: number;
  evalCount?: number;
  evalDuration?: number;
  totalDuration?: number;
}
