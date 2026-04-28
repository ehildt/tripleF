import { ApiProperty } from '@nestjs/swagger';

import { RealtimeInfo } from '../realtime-info.dto.js';

import { SupportedToolFunction } from './mcp.model.js';

export class McpTextContent {
  @ApiProperty({ example: 'text', type: String })
  type!: 'text';

  @ApiProperty({ example: 'Processing started...', type: String })
  text!: string;
}

export class McpToolsCallResult {
  @ApiProperty({ type: [McpTextContent] })
  content!: McpTextContent[];

  @ApiProperty({ example: false })
  isError!: boolean;

  @ApiProperty({ type: RealtimeInfo })
  realtime!: RealtimeInfo;
}

export class McpServerInfo {
  @ApiProperty({ example: '@ckir.io/visions', type: String })
  name!: string;

  @ApiProperty({ example: '1.1.0', type: String })
  version!: string;
}

export class McpCapabilities {
  @ApiProperty({ example: { listChanged: false } })
  tools!: { listChanged: boolean };
}

export class McpInitializeResult {
  @ApiProperty({ example: '2025-11-25', type: String })
  protocolVersion!: string;

  @ApiProperty({ type: McpCapabilities })
  capabilities!: McpCapabilities;

  @ApiProperty({ type: McpServerInfo })
  serverInfo!: McpServerInfo;
}

export class McpTool {
  @ApiProperty({ example: 'Vision Analysis', type: String })
  title!: string;

  @ApiProperty({ example: 'visions.analyze', type: String })
  name!: SupportedToolFunction;

  @ApiProperty({
    example: 'Perform a specific visual analysis...',
    type: String,
  })
  description!: string;

  @ApiProperty({ type: Object })
  inputSchema!: object;
}

export class McpToolsListResult {
  @ApiProperty({ type: [McpTool] })
  tools!: McpTool[];
}

export class McpInitializeResponse {
  @ApiProperty({ example: 1, type: Number })
  id!: number;

  @ApiProperty({ example: '2.0', type: String })
  jsonrpc!: '2.0';

  @ApiProperty({ type: McpInitializeResult })
  result!: McpInitializeResult;
}

export class McpToolsListResponse {
  @ApiProperty({ example: 1, type: Number })
  id!: number;

  @ApiProperty({ example: '2.0', type: String })
  jsonrpc!: '2.0';

  @ApiProperty({ type: McpToolsListResult })
  result!: McpToolsListResult;
}

export class McpToolsCallResponse {
  @ApiProperty({ example: 2, type: Number })
  id!: number;

  @ApiProperty({ example: '2.0', type: String })
  jsonrpc!: '2.0';

  @ApiProperty({ type: McpToolsCallResult })
  result!: McpToolsCallResult;
}
