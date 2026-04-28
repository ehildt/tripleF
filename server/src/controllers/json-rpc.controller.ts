import { BadRequestException, Controller, Post } from '@nestjs/common';

import { SocketIOConfigService } from '../configs/socket-io-config.service.js';
import { McpPayload } from '../decorators/json-rpc.decorators.js';
import { ApiMcpJsonRpc } from '../decorators/json-rpc.openapi.decorators.js';
import { FastifyMultipartMeta } from '../dtos/classic/get-fastify-multipart-data-req.dto.js';
import { McpGenericType } from '../dtos/json-rpc/mcp.model.js';
import { McpVisionPayloadReq_Params } from '../dtos/json-rpc/mcp-vision-payload-req.dto.js';
import { MCPHttpStatusCode } from '../interceptors/mcp-status.interceptor.js';
import { JsonRpcService } from '../services/json-rpc.service.js';

@Controller('mcp')
export class JsonRpcController {
  constructor(
    private readonly jsonRpcService: JsonRpcService,
    private readonly socketIOConfigService: SocketIOConfigService,
  ) {}

  private wrap(id: number | string | undefined, result: unknown) {
    const envelope: Record<string, unknown> = { jsonrpc: '2.0', result };
    if (id !== undefined) {
      envelope.id = id;
    }
    return envelope;
  }

  @Post()
  @ApiMcpJsonRpc()
  @MCPHttpStatusCode()
  async rpc(@McpPayload() req: McpGenericType<McpVisionPayloadReq_Params>) {
    if (req.method === 'initialize')
      return this.wrap(req.id, await this.jsonRpcService.initialize());

    if (req.method === 'tools/list')
      return await this.jsonRpcService.getRequestedTools(req);

    // MCP lifecycle notification sent by clients after initialize handshake.
    // No response is expected; silently accept it per MCP spec.
    if (req.method === 'notifications/initialized') return;

    const args = req.params?.arguments;

    if (!args?.model)
      throw new BadRequestException("Missing 'model' in arguments");

    const model = args.model;

    if (!args.images || args.images.length === 0)
      throw new BadRequestException('Missing images');

    const results = await this.jsonRpcService.toFilePayloadsFromBase64(
      args.requestId,
      args.images,
    );
    const buffers: Buffer[] = results.map((r) => r.buffer).filter(Boolean);
    const meta: Array<FastifyMultipartMeta> = results
      .map((r) => r.meta)
      .filter(Boolean);

    const name = req.params?.name;
    if (name === 'visions.analyze')
      return this.wrap(
        req.id,
        await this.jsonRpcService.analyze({
          buffers,
          meta: meta as any,
          filters: {
            vLLM: model,
            requestId: args.requestId,
            roomId: args.roomId,
            stream: args.stream ?? false,
            numCtx: args.numCtx,
            prompt: args.prompt,
            task: args.task,
            event: args.event ?? this.socketIOConfigService.config.event,
            preprocessing: args.preprocessing,
          },
        }),
      );
  }
}
