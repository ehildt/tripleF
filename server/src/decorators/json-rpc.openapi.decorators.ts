import { applyDecorators } from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBody,
  ApiConsumes,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  getSchemaPath,
} from '@nestjs/swagger';

import {
  McpInitializeResponse,
  McpToolsCallResponse,
  McpToolsListResponse,
} from '../dtos/json-rpc/mcp-response.dto.js';
import {
  McpToolsListReq,
  McpToolsListReq_Params,
} from '../dtos/json-rpc/mcp-tools-list-req.dto.js';
import { McpVisionPayloadReq } from '../dtos/json-rpc/mcp-vision-payload-req.dto.js';

const ApiJsonRpcBodySchema = () =>
  ApiBody({
    schema: {
      type: 'object',
      description: [
        '**JSON-RPC request body**',
        '',
        'A JSON-RPC 2.0 request envelope sent as the raw HTTP body.',
        "- jsonrpc MUST be '2.0'.",
        '- method determines the operation (initialize, tools/list, tools/call).',
        "- For tools/call, params.arguments MUST include 'requestId', 'model' and optionally 'images'.",
      ].join('\n'),
      oneOf: [
        { $ref: getSchemaPath(McpToolsListReq) },
        { $ref: getSchemaPath(McpVisionPayloadReq) },
      ],
    },
  });

export function ApiMcpJsonRpc() {
  return applyDecorators(
    ApiConsumes('application/json'),
    ApiExtraModels(
      McpVisionPayloadReq,
      McpToolsListReq,
      McpToolsListReq_Params,
      McpInitializeResponse,
      McpToolsListResponse,
      McpToolsCallResponse,
    ),
    ApiJsonRpcBodySchema(),
    ApiOkResponse({
      description: 'MCP initialize or tools/list response',
      schema: {
        oneOf: [
          { $ref: getSchemaPath(McpInitializeResponse) },
          { $ref: getSchemaPath(McpToolsListResponse) },
        ],
      },
    }),
    ApiAcceptedResponse({
      description: 'MCP tools/call response (async processing)',
      schema: {
        $ref: getSchemaPath(McpToolsCallResponse),
      },
    }),
    ApiOperation({
      summary: 'MCP JSON-RPC endpoint',
      description: `
      Accepts a JSON-RPC 2.0 MCP request as the raw HTTP body (application/json).
      Supports initialize, tools/list, and tools/call methods.`,
    }),
  );
}
