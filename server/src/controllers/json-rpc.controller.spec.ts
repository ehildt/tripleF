import { Test, TestingModule } from '@nestjs/testing';

import { SocketIOConfigService } from '../configs/socket-io-config.service.js';
import { JsonRpcService } from '../services/json-rpc.service.js';

import { JsonRpcController } from './json-rpc.controller.js';

vi.mock('@ehildt/ckir-helpers/hash-payload', () => ({
  hashPayload: vi.fn(() => 'hash123'),
}));

describe('JsonRpcController', () => {
  let controller: JsonRpcController;
  let jsonRpcService: JsonRpcService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JsonRpcController],
      providers: [
        {
          provide: JsonRpcService,
          useValue: {
            getRequestedTools: vi.fn().mockResolvedValue({
              jsonrpc: '2.0',
              id: 1,
              result: { tools: [] },
            }),
            toFilePayloads: vi
              .fn()
              .mockImplementation(
                async (_requestId: string, files: unknown[]) => {
                  if (!files || files.length === 0) return [];
                  return [
                    {
                      buffer: Buffer.from('image-bytes'),
                      meta: {
                        name: 'photo.jpg',
                        type: 'image/jpeg',
                        hash: 'hash123',
                      },
                    },
                  ];
                },
              ),
            toFilePayloadsFromBase64: vi.fn().mockImplementation(
              async (
                _requestId: string,
                images: Array<{
                  data: string;
                  mimeType?: string;
                  name?: string;
                }>,
              ) => {
                if (!images || images.length === 0) return [];
                return [
                  {
                    buffer: Buffer.from('base64-image-bytes'),
                    meta: {
                      name: images[0].name || 'image_1.png',
                      type: images[0].mimeType || 'image/png',
                      hash: 'hash123',
                    },
                  },
                ];
              },
            ),
            analyze: vi.fn(),
          },
        },
        {
          provide: SocketIOConfigService,
          useValue: {
            config: {
              event: 'vision',
            },
          },
        },
      ],
    }).compile();

    controller = module.get<JsonRpcController>(JsonRpcController);
    jsonRpcService = module.get<JsonRpcService>(JsonRpcService);
  });

  describe('rpc', () => {
    it('throws BadRequestException when model is missing in arguments', async () => {
      const req = {
        id: 1,
        method: 'tools/call',
        params: {
          name: 'visions.analyze',
          arguments: {
            requestId: 'batch-1',
            task: 'describe',
          },
        },
      } as any;

      await expect(controller.rpc(req)).rejects.toThrow(
        "Missing 'model' in arguments",
      );
    });

    it('throws BadRequestException when images are missing for tools/call', async () => {
      const req = {
        id: 1,
        method: 'tools/call',
        params: {
          name: 'visions.analyze',
          arguments: {
            requestId: 'batch-1',
            task: 'describe',
            model: 'llama3.2-vision',
          },
        },
      } as any;

      await expect(controller.rpc(req)).rejects.toThrow('Missing images');
    });

    it('returns tools list for tools/list method', async () => {
      const req = {
        id: 1,
        method: 'tools/list',
      } as any;

      const result = await controller.rpc(req);

      expect(jsonRpcService.getRequestedTools).toHaveBeenCalledWith(req);
      expect(result).toEqual({
        jsonrpc: '2.0',
        id: 1,
        result: { tools: [] },
      });
    });

    it('calls analyze for visions.analyze with base64 images', async () => {
      const requestId = 'batch-1';
      const model = 'llama3.2-vision';
      const roomId = 'room-1';
      const numCtx = 4096;
      const req = {
        id: 2,
        method: 'tools/call',
        params: {
          name: 'visions.analyze',
          arguments: {
            requestId,
            roomId,
            stream: true,
            numCtx,
            event: 'vision',
            model,
            task: 'describe',
            prompt: [{ role: 'user', content: 'test' }],
            images: [
              { data: 'base64abc', mimeType: 'image/png', name: 'test.png' },
            ],
          },
        },
      } as any;

      await controller.rpc(req);

      expect(jsonRpcService.toFilePayloadsFromBase64).toHaveBeenCalledWith(
        requestId,
        req.params.arguments.images,
      );
      expect(jsonRpcService.analyze).toHaveBeenCalledWith({
        buffers: [Buffer.from('base64-image-bytes')],
        meta: [{ name: 'test.png', type: 'image/png', hash: 'hash123' }],
        filters: {
          vLLM: model,
          requestId,
          roomId,
          stream: true,
          numCtx,
          prompt: [{ role: 'user', content: 'test' }],
          task: 'describe',
          event: 'vision',
        },
      });
    });

    it('uses default event when event is not provided in arguments', async () => {
      const requestId = 'batch-2';
      const model = 'llama3.2-vision';
      const req = {
        id: 3,
        method: 'tools/call',
        params: {
          name: 'visions.analyze',
          arguments: {
            requestId,
            model,
            task: 'describe',
            images: [
              { data: 'base64abc', mimeType: 'image/png', name: 'test.png' },
            ],
          },
        },
      } as any;

      await controller.rpc(req);

      expect(jsonRpcService.analyze).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            event: 'vision',
          }),
        }),
      );
    });

    it('throws BadRequestException when images array is empty for tools/call', async () => {
      const req = {
        id: 1,
        method: 'tools/call',
        params: {
          name: 'visions.analyze',
          arguments: {
            requestId: 'batch-1',
            task: 'ocr',
            model: 'llama3.2-vision',
            images: [],
          },
        },
      } as any;

      await expect(controller.rpc(req)).rejects.toThrow('Missing images');
    });
  });
});
