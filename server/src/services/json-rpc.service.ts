import { readPackageJsonFromRoot } from '@ehildt/ckir-helpers/bootstrap';
import { hashPayload } from '@ehildt/ckir-helpers/hash-payload';
import type { MultipartFile } from '@fastify/multipart';
import { BadRequestException, Injectable } from '@nestjs/common';

import { SocketIOConfigService } from '../configs/socket-io-config.service.js';
import { JSON_RPC_TOOLS_LIST } from '../constants/json-rpc.constants.js';
import {
  MCP_CAPABILITIES,
  MCP_PROTOCOL_VERSION,
} from '../constants/mcp.constants.js';
import {
  FastifyMultipartDataWithFiltersReq,
  FastifyMultipartMeta,
} from '../dtos/classic/get-fastify-multipart-data-req.dto.js';
import {
  McpGenericType,
  SupportedToolFunction,
} from '../dtos/json-rpc/mcp.model.js';

import { AnalyzeImageService } from './analyze-image.service.js';
@Injectable()
export class JsonRpcService {
  constructor(
    private readonly analyzeImageService: AnalyzeImageService,
    private readonly socketIOConfigService: SocketIOConfigService,
  ) {}

  async initialize() {
    const packageJson = readPackageJsonFromRoot() as {
      name: string;
      version: string;
    };

    return {
      protocolVersion: MCP_PROTOCOL_VERSION,
      capabilities: MCP_CAPABILITIES,
      serverInfo: { name: packageJson.name, version: packageJson.version },
    };
  }

  async getRequestedTools(req: McpGenericType) {
    const rTools: Array<SupportedToolFunction> = req.params?.requestedTools;
    if (!rTools?.length) return JSON_RPC_TOOLS_LIST;

    const available = new Set(
      JSON_RPC_TOOLS_LIST.result.tools.map((t) => t.name),
    );

    rTools.forEach((rt) => {
      if (!available.has(rt))
        throw new BadRequestException(`No such tool available ${rt}`);
    });

    const tools = JSON_RPC_TOOLS_LIST.result.tools.filter(({ name }) =>
      rTools.includes(name),
    );

    return {
      ...JSON_RPC_TOOLS_LIST,
      result: {
        tools,
      },
    };
  }

  async toFilePayloads(requestId: string, images: Array<MultipartFile>) {
    return await Promise.all(
      images.map(async (file) => {
        const buffer = await file.toBuffer();
        const hash = hashPayload(buffer, 'sha256');
        const meta: FastifyMultipartMeta = {
          name: file.filename,
          type: file.mimetype,
          hash: `${hash}_${requestId}`,
        };
        return { buffer, meta };
      }),
    );
  }

  async toFilePayloadsFromBase64(
    requestId: string,
    images: Array<{ data: string; mimeType?: string; name?: string }>,
  ) {
    const ALLOWED_MIME_TYPES = new Set([
      'image/png',
      'image/jpeg',
      'image/webp',
    ]);

    return images.map((image, index) => {
      const { data, mimeType, name } = image;
      if (!data || typeof data !== 'string')
        throw new BadRequestException(`Missing base64 data at index ${index}`);

      const type = (mimeType || 'image/png').toLowerCase();
      if (!ALLOWED_MIME_TYPES.has(type))
        throw new BadRequestException(
          `Invalid image type at index ${index}: ${type}`,
        );

      try {
        const buffer = Buffer.from(data, 'base64');
        const hash = hashPayload(buffer, 'sha256');
        const ext =
          type === 'image/png' ? 'png' : type === 'image/jpeg' ? 'jpg' : 'webp';

        const meta: FastifyMultipartMeta = {
          name: name || `image_${index + 1}.${ext}`,
          type,
          hash: `${hash}_${requestId}`,
        };
        return { buffer, meta };
      } catch {
        throw new BadRequestException(`Invalid base64 data at index ${index}`);
      }
    });
  }

  async analyze(req: FastifyMultipartDataWithFiltersReq) {
    void this.analyzeImageService.emit({
      buffers: req.buffers,
      meta: req.meta,
      filters: req.filters,
    });

    const event = req.filters.event;

    return {
      content: [
        {
          type: 'text',
          text: 'Processing will begin shortly.',
        },
      ],
      isError: false,
      realtime: {
        event,
        roomId: req.filters.roomId,
        requestId: req.filters.requestId,
      },
    };
  }
}
