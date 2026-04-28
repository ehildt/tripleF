import { BadRequestException, PipeTransform, Type } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { McpGenericType } from '../dtos/json-rpc/mcp.model.js';

export class JsonRpcValidationPipe<T> implements PipeTransform {
  constructor(private readonly funcDtoMap: Map<T, Type>) {}

  async transform(input: any): Promise<McpGenericType> {
    const value = this.normalizePayload(input);

    // JSON-RPC base validation
    if (value?.jsonrpc !== '2.0')
      throw new BadRequestException('Invalid jsonrpc version');

    if (!value.method) throw new BadRequestException('Missing method field');

    // tools/list passthrough
    if (value.method === 'tools/list') return value;

    // initialize passthrough
    if (value.method === 'initialize') return value;

    // MCP notifications (no id, no response needed)
    if (value.method === 'notifications/initialized') return value;

    // Only tools/call supported
    if (value.method !== 'tools/call')
      throw new BadRequestException(`Unsupported method: ${value.method}`);

    // Resolve DTO
    const func = value.params?.name as T;
    const dto = this.funcDtoMap.get(func);

    if (!dto) throw new BadRequestException(`Unsupported function: ${func}`);

    // Transform + validate
    const instance = plainToInstance(dto, value);
    const errors = await validate(instance, { whitelist: true });

    if (errors.length) {
      const messages = errors
        .map((e) =>
          e.constraints
            ? `${e.property}: ${Object.values(e.constraints).join(', ')}`
            : e.property,
        )
        .join('; ');

      throw new BadRequestException(`Validation failed: ${messages}`);
    }

    return instance;
  }

  private normalizePayload(input: any): any {
    let raw: any = input;

    // Case 1: already a valid JSON-RPC object
    if (raw && typeof raw === 'object' && raw.jsonrpc === '2.0') return raw;

    // Case 2: multipart field (type: 'field')
    if (raw?.type === 'field' && typeof raw.value === 'string') raw = raw.value;

    // Case 3: wrapped under fields.payload.value
    if (raw?.fields?.payload?.value) raw = raw.fields.payload.value;

    // Case 4: plain JSON string
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw);
      } catch {
        throw new BadRequestException('Invalid JSON payload');
      }
    }

    // Case 5: already an object
    if (typeof raw !== 'object' || raw === null)
      throw new BadRequestException('Invalid request payload');

    return raw;
  }
}
