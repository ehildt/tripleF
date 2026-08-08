export interface ExchangeLike {
  role: 'user' | 'assistant';
  status: string;
  promptEvalCount?: number;
  evalCount?: number;
}
