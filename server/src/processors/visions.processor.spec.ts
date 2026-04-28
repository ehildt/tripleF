import { BullMQLoggerService } from '@ehildt/nestjs-bullmq-logger';
import { OllamaService } from '@ehildt/nestjs-ollama';
import { SocketIOService } from '@ehildt/nestjs-socket.io';
import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bullmq';
import { vi } from 'vitest';

import { OllamaConfigService } from '../configs/ollama-config.service.js';
import { SocketIOConfigService } from '../configs/socket-io-config.service.js';
import { FastifyMultipartDataWithFiltersReq } from '../dtos/classic/get-fastify-multipart-data-req.dto.js';
import { JobTrackingService } from '../services/job-tracking.service.js';

import { SystemPromptKey, VisionsProcessor } from './visions.processor.js';

class TestVisionsProcessor extends VisionsProcessor {
  async process(_job: { data: FastifyMultipartDataWithFiltersReq }) {
    const { buffers, meta, filters } = _job.data;
    this.validateInput(buffers, meta);
    this.buildChatRequest(buffers, 'test.jpg', filters, 'DESCRIBE');
    return undefined as unknown as void;
  }

  testValidateInput(buffers: unknown, meta: unknown) {
    return this.validateInput(buffers, meta);
  }

  testBuildChatRequest(
    buffers: Buffer[],
    filenames: string,
    filters: FastifyMultipartDataWithFiltersReq['filters'],
    systemPromptKey: SystemPromptKey,
    userMessagePrefix?: string,
  ) {
    return this.buildChatRequest(
      buffers,
      filenames,
      filters,
      systemPromptKey,
      userMessagePrefix,
    );
  }

  async testEmitToSocket(
    roomId: string | undefined,
    event: string,
    data: unknown,
  ) {
    return this.emitToSocket(roomId, event, data);
  }

  async testHandleChat(
    job: Job<FastifyMultipartDataWithFiltersReq>,
    request: Parameters<typeof this.ollamaService.chat>[0],
    stream: boolean,
    onChunk: (response: { message: { content: string } }) => Promise<void>,
    token: string = 'test-token',
  ) {
    return this.handleVision(
      job,
      request,
      stream,
      onChunk,
      'test-request-id',
      token,
    );
  }
}

describe('VisionsProcessor', () => {
  let processor: TestVisionsProcessor;
  let ollamaService: OllamaService;
  let socketIOService: SocketIOService;
  let testModule: TestingModule;

  beforeEach(async () => {
    testModule = await Test.createTestingModule({
      providers: [
        TestVisionsProcessor,
        {
          provide: SocketIOService,
          useValue: {
            emit: vi.fn(),
            emitTo: vi.fn(),
          },
        },
        {
          provide: OllamaService,
          useValue: {
            chat: vi
              .fn()
              .mockResolvedValue({ message: { content: 'test response' } }),
          },
        },
        {
          provide: OllamaConfigService,
          useValue: {
            config: {
              systemPrompts: {
                DESCRIBE: 'You are a helpful image analyzer.',
                COMPARE: 'You compare images.',
                OCR: 'You extract text from images.',
              },
              keepAlive: '5m',
            },
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
        {
          provide: BullMQLoggerService,
          useValue: {
            log: vi.fn(),
            error: vi.fn(),
          },
        },
        {
          provide: JobTrackingService,
          useValue: {
            isCanceled: vi.fn().mockReturnValue(false),
            setActive: vi.fn(),
            remove: vi.fn(),
            cancel: vi.fn(),
            get: vi.fn(),
            add: vi.fn(),
          },
        },
      ],
    }).compile();

    processor = testModule.get<TestVisionsProcessor>(TestVisionsProcessor);
    ollamaService = testModule.get<OllamaService>(OllamaService);
    socketIOService = testModule.get<SocketIOService>(SocketIOService);
  });

  describe('validateInput', () => {
    it('does not throw when buffers and meta are valid arrays with matching lengths', () => {
      const buffers = [Buffer.from('test')];
      const meta = [{ name: 'test.jpg', type: 'image/jpeg', hash: 'abc' }];

      expect(() => processor.testValidateInput(buffers, meta)).not.toThrow();
    });

    it('throws when meta is not an array', () => {
      const buffers = [Buffer.from('test')];

      expect(() => processor.testValidateInput(buffers, null as any)).toThrow(
        'Missing meta',
      );
      expect(() =>
        processor.testValidateInput(buffers, undefined as any),
      ).toThrow('Missing meta');
      expect(() => processor.testValidateInput(buffers, {} as any)).toThrow(
        'Missing meta',
      );
    });

    it('throws when buffers is not an array', () => {
      const meta = [{ name: 'test.jpg', type: 'image/jpeg', hash: 'abc' }];

      expect(() => processor.testValidateInput(null as any, meta)).toThrow(
        'Missing buffers',
      );
      expect(() => processor.testValidateInput(undefined as any, meta)).toThrow(
        'Missing buffers',
      );
    });

    it('throws when buffers and meta have different lengths', () => {
      const buffers = [Buffer.from('test1'), Buffer.from('test2')];
      const meta = [{ name: 'test.jpg', type: 'image/jpeg', hash: 'abc' }];

      expect(() => processor.testValidateInput(buffers, meta)).toThrow(
        'buffers/meta length mismatch',
      );
    });
  });

  describe('buildChatRequest', () => {
    it('builds correct chat request with default prefix', () => {
      const buffers = [Buffer.from('image')];
      const filters = {
        vLLM: 'llama3.2-vision',
        stream: false,
        numCtx: 4096,
      } as FastifyMultipartDataWithFiltersReq['filters'];

      const result = processor.testBuildChatRequest(
        buffers,
        'test.jpg',
        filters,
        'DESCRIBE',
      );

      expect(result.messages).toHaveLength(2);
      expect(result.messages[0].role).toBe('system');
      expect(result.messages[0].content).toBe(
        'You are a helpful image analyzer.',
      );
      expect(result.messages[1].role).toBe('user');
      expect(result.messages[1].content).toBe('Image(s): test.jpg');
      expect(result.messages[1].images).toEqual(buffers);
      expect(result.options.num_ctx).toBe(4096);
      expect(result.stream).toBe(false);
      expect(result.model).toBe('llama3.2-vision');
      expect(result.keep_alive).toBe('5m');
    });

    it('builds correct chat request with custom prefix', () => {
      const buffers = [Buffer.from('image1'), Buffer.from('image2')];
      const filters = {
        vLLM: 'llama3.2-vision',
        stream: true,
      } as FastifyMultipartDataWithFiltersReq['filters'];

      const result = processor.testBuildChatRequest(
        buffers,
        'a.jpg,b.jpg',
        filters,
        'COMPARE',
        'Images:',
      );

      expect(result.messages[1].content).toBe('Images: a.jpg,b.jpg');
      expect(result.stream).toBe(true);
    });

    it('includes prompt filters in messages', () => {
      const buffers = [Buffer.from('image')];
      const filters = {
        vLLM: 'llama3.2-vision',
        prompt: [{ role: 'system', content: 'Additional instruction' }],
      } as FastifyMultipartDataWithFiltersReq['filters'];

      const result = processor.testBuildChatRequest(
        buffers,
        'test.jpg',
        filters,
        'DESCRIBE',
      );

      expect(result.messages).toHaveLength(3);
      expect(result.messages[1].role).toBe('system');
      expect(result.messages[1].content).toBe('Additional instruction');
    });

    it('filters out null/undefined prompts', () => {
      const buffers = [Buffer.from('image')];
      const filters = {
        vLLM: 'llama3.2-vision',
        prompt: [
          { role: 'system', content: 'Valid prompt' },
          null as any,
          undefined as any,
        ],
      } as FastifyMultipartDataWithFiltersReq['filters'];

      const result = processor.testBuildChatRequest(
        buffers,
        'test.jpg',
        filters,
        'DESCRIBE',
      );

      expect(result.messages).toHaveLength(3);
    });
  });

  describe('emitToSocket', () => {
    it('emits to room when roomId is provided', async () => {
      const data = { message: 'test' };

      await processor.testEmitToSocket('room-1', 'vision', data);

      expect(socketIOService.emitTo).toHaveBeenCalledWith('vision', 'room-1', {
        event: 'vision',
        ...data,
      });
    });

    it('emits globally when roomId is undefined', async () => {
      const data = { message: 'test' };

      await processor.testEmitToSocket(undefined, 'vision', data);

      expect(socketIOService.emit).toHaveBeenCalledWith('vision', {
        event: 'vision',
        ...data,
      });
    });

    it('handles errors gracefully', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      (socketIOService.emit as any).mockImplementationOnce(() => {
        throw new Error('Socket error');
      });

      await expect(
        processor.testEmitToSocket(undefined, 'vision', {}),
      ).resolves.not.toThrow();

      consoleSpy.mockRestore();
    });
  });

  describe('handleChat', () => {
    const createMockJob = (): Job<FastifyMultipartDataWithFiltersReq> =>
      ({ name: 'test-request-id' }) as Job<FastifyMultipartDataWithFiltersReq>;

    it('calls ollamaService.chat with stream=false and invokes onChunk', async () => {
      const request = { messages: [], model: 'test' };
      const onChunk = vi.fn().mockResolvedValue(undefined);

      await processor.testHandleChat(createMockJob(), request, false, onChunk);

      expect(ollamaService.chat).toHaveBeenCalledWith(request);
      expect(onChunk).toHaveBeenCalledWith({
        message: { content: 'test response' },
      });
    });

    it('calls ollamaService.chat with stream=true and a callback', async () => {
      const request = { messages: [], model: 'test', stream: true };
      const onChunk = vi.fn().mockResolvedValue(undefined);

      await processor.testHandleChat(createMockJob(), request, true, onChunk);

      expect(ollamaService.chat).toHaveBeenCalledWith(
        request,
        expect.any(Function),
      );
    });

    it('does not call onChunk if job is canceled', async () => {
      const request = { messages: [], model: 'test' };
      const onChunk = vi.fn().mockResolvedValue(undefined);

      // Mock the job tracking to say the job is canceled
      const jobTrackingService = testModule.get(JobTrackingService);
      (jobTrackingService.isCanceled as any).mockReturnValue(true);

      // Should throw UnrecoverableError when canceled
      await expect(
        processor.testHandleChat(createMockJob(), request, false, onChunk),
      ).rejects.toThrow('Job canceled');

      // When canceled, chat should NOT be called for non-streaming
      expect(ollamaService.chat).not.toHaveBeenCalled();
      expect(onChunk).not.toHaveBeenCalled();
    });

    it('stops processing chunks when job is canceled in streaming mode', async () => {
      const request = { messages: [], model: 'test', stream: true };
      const onChunk = vi.fn().mockResolvedValue(undefined);

      // Mock ollama to simulate streaming by calling the callback
      const mockResponse = { message: { content: 'test chunk' } };
      (ollamaService.chat as any).mockImplementation(
        async (_req: unknown, callback: (resp: unknown) => Promise<void>) => {
          await callback(mockResponse);
        },
      );

      // Mock the job tracking to say the job is canceled
      const jobTrackingService = testModule.get(JobTrackingService);
      (jobTrackingService.isCanceled as any).mockReturnValue(true);

      // Should throw UnrecoverableError to prevent retries
      await expect(
        processor.testHandleChat(createMockJob(), request, true, onChunk),
      ).rejects.toThrow('Job canceled during streaming');

      // When canceled in streaming, chat is called but onChunk should not be called
      expect(ollamaService.chat).toHaveBeenCalledWith(
        request,
        expect.any(Function),
      );
      expect(onChunk).not.toHaveBeenCalled();
    });
  });
});
