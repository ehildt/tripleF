import { McpVisionPayloadReq } from '../dtos/json-rpc/mcp-vision-payload-req.dto.js';

import { JsonRpcValidationPipe } from './json-rpc-validation.pipe.js';

describe('JsonRpcValidationPipe with McpVisionPayloadReq', () => {
  let pipe: JsonRpcValidationPipe<string>;

  beforeEach(() => {
    const funcDtoMap = new Map<string, any>([
      ['visions.analyze', McpVisionPayloadReq],
    ]);
    pipe = new JsonRpcValidationPipe(funcDtoMap);
  });

  const validBasePayload = {
    id: 1,
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'visions.analyze',
      arguments: {
        model: 'llama3.2-vision',
        requestId: 'test-request-id',
      },
    },
  };

  it('should pass valid payload', async () => {
    const result = await pipe.transform(validBasePayload);
    expect(result).toBeInstanceOf(McpVisionPayloadReq);
    expect(result.id).toBe(1);
    expect(result.params.name).toBe('visions.analyze');
  });

  it('should throw if jsonrpc version is invalid', async () => {
    const payload = { ...validBasePayload, jsonrpc: '1.0' };
    await expect(pipe.transform(payload)).rejects.toThrow(
      'Invalid jsonrpc version',
    );
  });

  it('should throw if method is missing', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { method, ...payload } = validBasePayload;
    await expect(pipe.transform(payload)).rejects.toThrow(
      'Missing method field',
    );
  });

  it('should throw if method is unsupported', async () => {
    const payload = { ...validBasePayload, method: 'tools/unknown' };
    await expect(pipe.transform(payload)).rejects.toThrow(
      'Unsupported method: tools/unknown',
    );
  });

  it('should throw if name is unsupported', async () => {
    const payload = {
      ...validBasePayload,
      params: { name: 'unknown', arguments: {} },
    };
    await expect(pipe.transform(payload)).rejects.toThrow(
      'Unsupported function: unknown',
    );
  });

  it('should validate nested arguments', async () => {
    const payload = {
      ...validBasePayload,
      params: {
        name: 'visions.analyze',
        arguments: {
          model: 'llama3.2-vision',
          requestId: 'test-request-id',
          task: 123,
        }, // invalid, should be string
      },
    };
    await expect(pipe.transform(payload)).rejects.toThrow(/Validation failed/);
  });

  it('should pass when nested arguments are valid', async () => {
    const payload = {
      ...validBasePayload,
      params: {
        name: 'visions.analyze',
        arguments: {
          task: 'describe',
          model: 'llama3.2-vision',
          requestId: 'test-request-id',
        },
      },
    };
    const result = await pipe.transform(payload);
    expect(result.params.arguments.task).toBe('describe');
  });

  it('should unwrap stringified JSON', async () => {
    const payloadStr = JSON.stringify(validBasePayload);
    const result = await pipe.transform(payloadStr);
    expect(result).toBeInstanceOf(McpVisionPayloadReq);
  });

  it('should unwrap multipart field', async () => {
    const payload = { type: 'field', value: JSON.stringify(validBasePayload) };
    const result = await pipe.transform(payload);
    expect(result).toBeInstanceOf(McpVisionPayloadReq);
  });

  it('should unwrap fields.payload.value', async () => {
    const payload = {
      fields: { payload: { value: JSON.stringify(validBasePayload) } },
    };
    const result = await pipe.transform(payload);
    expect(result).toBeInstanceOf(McpVisionPayloadReq);
  });

  it('should handle user payload format with name and arguments', async () => {
    const payload = {
      id: 1,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'visions.analyze',
        arguments: {
          model: 'llama3.2-vision',
          task: 'describe',
          requestId: 'test-request-id',
          prompt: [{ role: 'user', content: 'optional prompt' }],
        },
      },
    };
    const result = await pipe.transform(payload);
    expect(result.params.name).toBe('visions.analyze');
    expect(result.params.arguments.task).toBe('describe');
    expect(result.params.arguments.prompt).toEqual([
      { role: 'user', content: 'optional prompt' },
    ]);
  });

  it('should unwrap fastify multipart file payload', async () => {
    const multipartPayload = {
      type: 'field',
      filename: 'payload',
      encoding: '7bit',
      mimetype: 'application/json',
      value: JSON.stringify(validBasePayload),
    };
    const result = await pipe.transform(multipartPayload);
    expect(result).toBeInstanceOf(McpVisionPayloadReq);
  });

  it('should throw if JSON string is invalid', async () => {
    const payload = 'not valid json';
    await expect(pipe.transform(payload)).rejects.toThrow(
      'Invalid JSON payload',
    );
  });

  it('should throw if payload is not an object', async () => {
    const payload = 123;
    await expect(pipe.transform(payload)).rejects.toThrow(
      'Invalid request payload',
    );
  });

  it('should throw if payload is null', async () => {
    const payload = null;
    await expect(pipe.transform(payload)).rejects.toThrow(
      'Invalid request payload',
    );
  });

  it('should pass through tools/list method', async () => {
    const payload = {
      id: 1,
      jsonrpc: '2.0',
      method: 'tools/list',
    };
    const result = await pipe.transform(payload);
    expect(result.method).toBe('tools/list');
  });
});
