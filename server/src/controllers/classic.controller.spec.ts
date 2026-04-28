import { Readable } from 'node:stream';

import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { SocketIOConfigService } from '../configs/socket-io-config.service.js';
import { AnalyzeImageService } from '../services/analyze-image.service.js';
import { OllamaModelsService } from '../services/ollama-models.service.js';

import { ClassicController } from './classic.controller.js';

vi.mock('@ehildt/ckir-helpers/hash-payload', () => ({
  hashPayload: vi.fn(() => 'hash123'),
}));

describe('ClassicController', () => {
  let controller: ClassicController;
  let analyzeImageService: AnalyzeImageService;

  const makeFile = () => ({
    type: 'file',
    fieldname: 'image',
    filename: 'photo.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    fields: {},
    file: Object.assign(new Readable({ read() {} }), {
      truncated: false,
      bytesRead: 0,
    }),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('image-bytes')),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClassicController],
      providers: [
        {
          provide: AnalyzeImageService,
          useValue: {
            toFilePayloads: vi.fn(
              async (_requestId: string, files: unknown[]) => {
                if (!files || (files as unknown[]).length === 0) return [];
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
            emit: vi.fn(),
          },
        },
        {
          provide: SocketIOConfigService,
          useValue: {
            config: { event: 'vision' },
          },
        },
        {
          provide: OllamaModelsService,
          useValue: {
            getModels: vi
              .fn()
              .mockResolvedValue(['llama3.2-vision', 'minicpm']),
          },
        },
        Logger,
      ],
    }).compile();

    controller = module.get<ClassicController>(ClassicController);
    analyzeImageService = module.get<AnalyzeImageService>(AnalyzeImageService);
  });

  function callVisionStream(args: {
    requestId: string;
    vLLM?: string;
    stream?: boolean;
    task: any;
    roomId?: string;
    prompt?: any;
    numCtx?: number;
    eventQuery?: string;
    images?: any[];
    preprocessing?: any;
  }) {
    const {
      requestId,
      vLLM,
      stream = false,
      task,
      roomId,
      prompt,
      numCtx,
      eventQuery,
      images,
      preprocessing,
    } = args;

    // ClassicController.visionStream takes 28 parameters before images:
    // requestId, vLLM, stream, task, roomId, prompt, numCtx, eventQuery,
    // pprocEnabled, pprocOriginal, pprocGrayscale, pprocDenoised, pprocSharpened, pprocClahe,
    // pprocResizeMaxWidth, pprocResizeMaxHeight, pprocResizeWithoutEnlargement,
    // pprocBlurSigma, pprocSharpenSigma, pprocSharpenM1, pprocSharpenM2,
    // pprocBrightnessLevel, pprocClaheWidth, pprocClaheHeight, pprocClaheMaxSlope,
    // pprocNormalizeLower, pprocNormalizeUpper,
    // images
    return controller.visionStream(
      requestId,
      vLLM as string,
      stream,
      task,
      roomId,
      prompt,
      numCtx,
      eventQuery,
      preprocessing?.enabled,
      preprocessing?.variants?.original,
      preprocessing?.variants?.grayscale,
      preprocessing?.variants?.denoised,
      preprocessing?.variants?.sharpened,
      preprocessing?.variants?.clahe,
      preprocessing?.resize?.maxWidth,
      preprocessing?.resize?.maxHeight,
      preprocessing?.resize?.withoutEnlargement,
      preprocessing?.parameters?.blurSigma,
      preprocessing?.parameters?.sharpenSigma,
      preprocessing?.parameters?.sharpenM1,
      preprocessing?.parameters?.sharpenM2,
      preprocessing?.parameters?.brightnessLevel,
      preprocessing?.parameters?.claheWidth,
      preprocessing?.parameters?.claheHeight,
      preprocessing?.parameters?.claheMaxSlope,
      preprocessing?.parameters?.normalizeLower,
      preprocessing?.parameters?.normalizeUpper,
      images,
    );
  }

  describe('visionStream', () => {
    it('throws BadRequestException when x-vision-llm header is missing', async () => {
      await expect(
        callVisionStream({
          requestId: 'batch-1',
          task: { value: 'describe' },
          images: [],
        }),
      ).rejects.toThrow('Missing x-vision-llm header');
    });

    it('calls analyzeImageService with correct parameters', async () => {
      const requestId = 'batch-1';
      const vLLM = 'llama3.2-vision';
      const stream = false;
      const task = { value: 'describe' };
      const roomId = 'room-1';
      const numCtx = 4096;
      const images = [makeFile()];

      await callVisionStream({
        requestId,
        vLLM,
        stream,
        task,
        roomId,
        numCtx,
        images,
      });

      expect(analyzeImageService.toFilePayloads).toHaveBeenCalledWith(
        requestId,
        images,
      );
      expect(analyzeImageService.emit).toHaveBeenCalledWith({
        buffers: [Buffer.from('image-bytes')],
        meta: [{ name: 'photo.jpg', type: 'image/jpeg', hash: 'hash123' }],
        filters: {
          vLLM,
          requestId,
          roomId,
          stream,
          numCtx,
          prompt: undefined,
          task: 'describe',
          event: 'vision',
          preprocessing: undefined,
        },
      });
    });

    it('processes images and calls analyzeImageService.emit', async () => {
      const requestId = 'batch-1';
      const vLLM = 'llama3.2-vision';
      const stream = true;
      const task = { value: 'compare' };
      const images = [makeFile()];

      await callVisionStream({
        requestId,
        vLLM,
        stream,
        task,
        images,
      });

      expect(analyzeImageService.toFilePayloads).toHaveBeenCalledWith(
        requestId,
        images,
      );
      expect(analyzeImageService.emit).toHaveBeenCalledWith({
        buffers: [Buffer.from('image-bytes')],
        meta: [{ name: 'photo.jpg', type: 'image/jpeg', hash: 'hash123' }],
        filters: {
          vLLM,
          requestId,
          roomId: undefined,
          stream: true,
          numCtx: undefined,
          prompt: undefined,
          task: 'compare',
          event: 'vision',
          preprocessing: undefined,
        },
      });
    });

    it('handles empty images array', async () => {
      const requestId = 'batch-1';
      const vLLM = 'llama3.2-vision';
      const stream = false;
      const task = { value: 'ocr' };

      await callVisionStream({
        requestId,
        vLLM,
        stream,
        task,
        images: [],
      });

      expect(analyzeImageService.toFilePayloads).toHaveBeenCalledWith(
        requestId,
        [],
      );
      expect(analyzeImageService.emit).toHaveBeenCalledWith({
        buffers: [],
        meta: [],
        filters: {
          vLLM,
          requestId,
          roomId: undefined,
          stream: false,
          numCtx: undefined,
          prompt: undefined,
          task: 'ocr',
          event: 'vision',
          preprocessing: undefined,
        },
      });
    });
  });
});
