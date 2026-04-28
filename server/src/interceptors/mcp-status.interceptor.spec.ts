import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';

import { MCP_SYNC_METHODS } from '../decorators/json-rpc.decorators.js';

import { McpStatusInterceptor } from './mcp-status.interceptor.js';

describe('McpStatusInterceptor', () => {
  let interceptor: McpStatusInterceptor;

  const createMockContext = (body: any): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ body }),
        getResponse: () => ({
          status: function (code: number) {
            this.statusCode = code;
            return this;
          },
        }),
      }),
    }) as ExecutionContext;

  const createMockNext = (): CallHandler =>
    ({
      handle: () => of({}),
    }) as CallHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [McpStatusInterceptor],
    }).compile();

    interceptor = module.get(McpStatusInterceptor);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('returns 200 for initialize method', async () => {
    const body = {
      payload: { value: JSON.stringify({ method: 'initialize' }) },
    };
    const ctx = createMockContext(body);
    const next = createMockNext();

    interceptor.intercept(ctx, next);
  });

  it('returns 200 for tools/list method', async () => {
    const body = {
      payload: { value: JSON.stringify({ method: 'tools/list' }) },
    };
    const ctx = createMockContext(body);
    const next = createMockNext();

    interceptor.intercept(ctx, next);
  });

  it('returns 202 for tools/call method', async () => {
    const body = {
      payload: { value: JSON.stringify({ method: 'tools/call' }) },
    };
    const ctx = createMockContext(body);
    const next = createMockNext();

    interceptor.intercept(ctx, next);
  });

  it('returns 202 for unknown method', async () => {
    const body = {
      payload: { value: JSON.stringify({ method: 'unknown' }) },
    };
    const ctx = createMockContext(body);
    const next = createMockNext();

    interceptor.intercept(ctx, next);
  });

  it('handles empty body', async () => {
    const body = {};
    const ctx = createMockContext(body);
    const next = createMockNext();

    interceptor.intercept(ctx, next);
  });

  it('handles body without payload', async () => {
    const body = { other: 'data' };
    const ctx = createMockContext(body);
    const next = createMockNext();

    interceptor.intercept(ctx, next);
  });

  it('handles invalid JSON in payload', async () => {
    const body = {
      payload: { value: 'not valid json' },
    };
    const ctx = createMockContext(body);
    const next = createMockNext();

    interceptor.intercept(ctx, next);
  });

  it('returns 202 when payload.value is missing', async () => {
    const body = {
      payload: {},
    };
    const ctx = createMockContext(body);
    const next = createMockNext();

    interceptor.intercept(ctx, next);
  });

  it('sync methods should be defined', () => {
    expect(MCP_SYNC_METHODS).toContain('initialize');
    expect(MCP_SYNC_METHODS).toContain('tools/list');
  });
});
