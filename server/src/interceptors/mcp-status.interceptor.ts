import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { Observable } from 'rxjs';

import { MCP_SYNC_METHODS } from '../decorators/json-rpc.decorators.js';

@Injectable()
export class McpStatusInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const res = ctx.switchToHttp().getResponse<FastifyReply>();
    const req = ctx.switchToHttp().getRequest() as {
      body?: Record<string, unknown>;
    };

    let method = '';
    const body = req.body as Record<string, unknown> | undefined;

    if (body) {
      // Case: plain JSON body
      if (typeof body.method === 'string') {
        method = body.method;
      }

      // Legacy: multipart wrapper (attachFieldsToBody)
      if (!method) {
        const payload = body.payload as
          | {
              value?: string;
            }
          | undefined;

        if (payload?.value) {
          try {
            const parsed = JSON.parse(payload.value);
            method = parsed.method;
          } catch {
            // ignore parse errors
          }
        }
      }
    }

    const isSync = MCP_SYNC_METHODS.includes(method);
    res.status(isSync ? 200 : 202);

    return next.handle();
  }
}

export const MCPHttpStatusCode = () => UseInterceptors(McpStatusInterceptor);
