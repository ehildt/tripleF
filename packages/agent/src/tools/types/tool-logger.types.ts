/**
 * Minimal logger surface the tools need — the server's NestJS Logger satisfies
 * it structurally, so the tools stay decoupled from @nestjs/common.
 */
export interface ToolLogger {
  log: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
  debug?: (message: string, ...args: unknown[]) => void;
}
