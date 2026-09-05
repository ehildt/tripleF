import { Test, TestingModule } from '@nestjs/testing';
import { AiSdkService } from '@triplef/ai-sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PdfPageDescribeService } from './pdf-page-describe.service.js';

describe('PdfPageDescribeService', () => {
  let service: PdfPageDescribeService;
  let generateChat: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    generateChat = vi.fn(async () => ({ text: '  layout and text  ' }));
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PdfPageDescribeService,
        { provide: AiSdkService, useValue: { generateChat } },
      ],
    }).compile();
    service = module.get<PdfPageDescribeService>(PdfPageDescribeService);
  });

  it('describes pages sequentially, one call per page, thinking off', async () => {
    const descriptions = await service.describePages({
      model: 'vision-model',
      documentName: 'cv.pdf',
      pageCount: 3,
      pages: [
        { buffer: Buffer.from('png-1'), pageNumber: 1 },
        { buffer: Buffer.from('png-3'), pageNumber: 3 },
      ],
    });

    expect(generateChat).toHaveBeenCalledTimes(2);
    const [first, second] = generateChat.mock.calls.map(([call]) => call);
    expect(first.model).toBe('vision-model');
    expect(first.messages[0].content).toContain('page 1 of 3');
    expect(first.messages[0].content).toContain('"cv.pdf"');
    expect(first.messages[0].images).toHaveLength(1);
    expect(first.providerOptions).toEqual({ ollama: { think: false } });
    expect(second.messages[0].content).toContain('page 3 of 3');
    expect(descriptions.get(1)).toBe('layout and text');
    expect(descriptions.get(3)).toBe('layout and text');
  });

  it('stores an empty description when the model reports an empty page', async () => {
    generateChat.mockResolvedValueOnce({ text: '' });

    const descriptions = await service.describePages({
      model: 'vision-model',
      documentName: 'blank.pdf',
      pageCount: 1,
      pages: [{ buffer: Buffer.from('png'), pageNumber: 1 }],
    });

    expect(descriptions.get(1)).toBe('');
  });

  it('propagates model failures so nothing gets persisted', async () => {
    generateChat.mockRejectedValueOnce(new Error('model exploded'));

    await expect(
      service.describePages({
        model: 'vision-model',
        documentName: 'doc.pdf',
        pageCount: 2,
        pages: [{ buffer: Buffer.from('png'), pageNumber: 1 }],
      }),
    ).rejects.toThrow('model exploded');
  });
});
