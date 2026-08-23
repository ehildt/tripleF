import { All, Controller, Req, Res } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { MemoryClientService } from '../services/memory-client.service.js';

/**
 * Transparent pass-through for the dashboard's /api/v1/qdrant/* calls to the
 * memory app. The dashboard is untouched: it still talks to the server, the
 * server forwards. The memory app validates DTOs and produces the responses;
 * this controller only relays method, path, query, JSON body, and the
 * content-type/accept headers.
 */
@Controller('qdrant')
export class QdrantProxyController {
  constructor(private readonly memoryClient: MemoryClientService) {}

  // One catch-all for the whole /qdrant/* surface (memory, memory/cognition,
  // text, search, status). It must be a single route: stacked @All() +
  // @All('*') decorators collapse to the bare controller root, leaving every
  // sub-path the dashboard calls 404ing before it reaches the proxy.
  @All('*')
  async proxy(
    @Req() request: FastifyRequest,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    await this.memoryClient.forward(request, reply);
  }
}
