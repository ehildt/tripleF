import { Test, TestingModule } from '@nestjs/testing';
import { AiSdkService } from '@triplef/ai-sdk';
import { SocketIOService } from '@triplef/socketio';
import { vi } from 'vitest';

import { MinioService } from '../../minio/services/minio.service.js';

import { HarnessChatStreamingService } from './harness-chat-streaming.service.js';

describe('HarnessChatStreamingService', () => {
  let service: HarnessChatStreamingService;
  let io: SocketIOService;
  let aiSdkService: AiSdkService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        HarnessChatStreamingService,
        {
          provide: SocketIOService,
          useValue: {
            emit: vi.fn(),
            emitTo: vi.fn(),
          },
        },
        {
          provide: AiSdkService,
          useValue: {
            streamChat: vi.fn(),
            generateChat: vi.fn(),
          },
        },
        {
          provide: MinioService,
          useValue: { objectExists: vi.fn().mockResolvedValue(true) },
        },
      ],
    }).compile();

    service = module.get<HarnessChatStreamingService>(
      HarnessChatStreamingService,
    );
    io = module.get<SocketIOService>(SocketIOService);
    aiSdkService = module.get<AiSdkService>(AiSdkService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('emits clarification question and does not call AI SDK', async () => {
    const ctx = {
      doneReason: 'clarification',
      requestId: 'req-1',
      filters: {},
      model: 'model',
      roomId: 'room-1',
      event: 'harness',
      outputs: {
        intent: { clarificationQuestion: 'What do you mean?' },
      },
    } as any;

    await service.streamResult(ctx);

    expect(aiSdkService.streamChat).not.toHaveBeenCalled();
    expect(aiSdkService.generateChat).not.toHaveBeenCalled();
    expect(io.emitTo).toHaveBeenCalledWith('harness', 'room-1', {
      event: 'harness',
      requestId: 'req-1',
      model: 'model',
      template: 'text',
      delta: 'What do you mean?',
      done: true,
    });
  });

  it('emits error payload as text template delta and does not call AI SDK', async () => {
    const ctx = {
      doneReason: 'error',
      requestId: 'req-1',
      filters: {},
      model: 'model',
      roomId: 'room-1',
      event: 'harness',
      error: 'boom',
    } as any;

    await service.streamResult(ctx);

    expect(aiSdkService.streamChat).not.toHaveBeenCalled();
    expect(aiSdkService.generateChat).not.toHaveBeenCalled();
    expect(io.emitTo).toHaveBeenCalledWith('harness', 'room-1', {
      event: 'harness',
      requestId: 'req-1',
      model: 'model',
      template: 'text',
      delta: 'boom',
      error: 'boom',
      done: true,
    });
  });

  it('emits missing content error as text template delta when no final content exists', async () => {
    const ctx = {
      done: false,
      doneReason: undefined,
      requestId: 'req-1',
      filters: {},
      model: 'model',
      roomId: 'room-1',
      event: 'harness',
      stream: false,
      outputs: { toolResults: [] },
    } as any;

    await service.streamResult(ctx);

    expect(aiSdkService.streamChat).not.toHaveBeenCalled();
    expect(aiSdkService.generateChat).not.toHaveBeenCalled();
    expect(io.emitTo).toHaveBeenCalledWith('harness', 'room-1', {
      event: 'harness',
      requestId: 'req-1',
      model: 'model',
      template: 'text',
      delta: 'No response content produced',
      error: 'No response content produced',
      done: true,
    });
  });

  it('emits empty final delta for streamed structured responses', async () => {
    const ctx = {
      done: false,
      doneReason: undefined,
      requestId: 'req-1',
      sessionId: 'sess-1',
      filters: { conversationId: 'conv-1' },
      model: 'model',
      roomId: 'room-1',
      event: 'harness',
      stream: true,
      hasNewImages: true,
      lastUserPrompt: 'describe this',
      processedMeta: [{ name: 'img.png', hash: 'h' }],
      buffers: [Buffer.from('image')],
      outputs: {
        intent: { template: 'describe' },
        finalContent: '{"title":"Image"}',
        toolResults: [{ toolName: 'webSearch', result: { x: 1 } }],
      },
    } as any;

    await service.streamResult(ctx);

    expect(aiSdkService.streamChat).not.toHaveBeenCalled();
    expect(aiSdkService.generateChat).not.toHaveBeenCalled();

    expect(io.emitTo).toHaveBeenCalledWith('harness', 'room-1', {
      event: 'harness',
      requestId: 'req-1',
      model: 'model',
      template: 'describe',
      delta: '',
      data: undefined,
      // Image tasks: the response gallery is cloud reference images only —
      // the user's uploaded local image never reaches the client gallery.
      images: [],
      toolResults: [{ toolName: 'webSearch', result: { x: 1 } }],
      meta: [
        { name: 'img.png', hash: 'h', source: 'local', variant: 'original' },
      ],
      prompt: 'describe this',
      promptEvalCount: undefined,
      evalCount: undefined,
      done: true,
    });
  });

  it('emits full JSON delta plus guarded data for non-streamed structured responses', async () => {
    const ctx = {
      done: false,
      doneReason: undefined,
      requestId: 'req-1',
      sessionId: 'sess-1',
      filters: { conversationId: 'conv-1' },
      model: 'model',
      roomId: 'room-1',
      event: 'harness',
      stream: false,
      hasNewImages: true,
      lastUserPrompt: 'describe this',
      processedMeta: [{ name: 'img.png', hash: 'h' }],
      buffers: [Buffer.from('image')],
      outputs: {
        intent: { template: 'describe' },
        finalContent: '{"title":"Image"}',
        finalData: { title: 'Image' },
        toolResults: [],
      },
    } as any;

    await service.streamResult(ctx);

    expect(io.emitTo).toHaveBeenCalledWith('harness', 'room-1', {
      event: 'harness',
      requestId: 'req-1',
      model: 'model',
      template: 'describe',
      delta: '{"title":"Image"}',
      data: { title: 'Image' },
      // Image tasks: the response gallery is cloud reference images only —
      // the user's uploaded local image never reaches the client gallery.
      images: [],
      toolResults: [],
      meta: [
        { name: 'img.png', hash: 'h', source: 'local', variant: 'original' },
      ],
      prompt: 'describe this',
      promptEvalCount: undefined,
      evalCount: undefined,
      done: true,
    });
  });
});
