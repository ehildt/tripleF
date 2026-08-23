import { All, Controller, Req, Res } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { MemoryClientService } from '../services/memory-client.service.js';

/**
 * Transparent pass-through for the moved /api/v1/memory-overrides calls
 * (the dashboard SysCtl tab edits memory-overrides through the memory app).
 */
@Controller('memory-overrides')
export class MemoryOverridesProxyController {
  constructor(private readonly memoryClient: MemoryClientService) {}

  @All()
  @All('*')
  async proxy(
    @Req() request: FastifyRequest,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    await this.memoryClient.forward(request, reply);
  }
}
