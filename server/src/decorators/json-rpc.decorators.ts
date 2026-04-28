import { Body, Type } from '@nestjs/common';

import { SupportedToolFunction } from '../dtos/json-rpc/mcp.model.js';
import { McpVisionPayloadReq } from '../dtos/json-rpc/mcp-vision-payload-req.dto.js';
import { JsonRpcValidationPipe } from '../pipes/json-rpc-validation.pipe.js';

const MCP_DTO_MAP = new Map<SupportedToolFunction, Type>([
  ['visions.analyze', McpVisionPayloadReq],
]);

export const McpPayload = () => Body(new JsonRpcValidationPipe(MCP_DTO_MAP));

export const MCP_SYNC_METHODS = ['tools/list', 'initialize'];
