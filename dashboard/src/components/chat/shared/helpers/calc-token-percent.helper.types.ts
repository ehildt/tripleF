export interface TokenBearingExchange {
  id?: string;
  role: string;
  status: string;
  included?: boolean;
  promptEvalCount?: number;
  evalCount?: number;
  inputTokenDelta?: number;
}
