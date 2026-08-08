export interface SessionSnapshot {
  exchanges: {
    role: string;
    status: string;
    promptEvalCount?: number;
    evalCount?: number;
  }[];
  numCtx: string;
}
