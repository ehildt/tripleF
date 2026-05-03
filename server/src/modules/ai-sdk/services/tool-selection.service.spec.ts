import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';

import { ProviderOverridesService } from '../../provider-overrides/services/provider-overrides.service.js';

import { AiSdkService } from './ai-sdk.service.js';
import { ToolSelectionService } from './tool-selection.service.js';

describe('ToolSelectionService', () => {
  let service: ToolSelectionService;
  let providerOverrides: ProviderOverridesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToolSelectionService,
        {
          provide: ProviderOverridesService,
          useValue: {
            getConfig: vi.fn().mockReturnValue({
              serper: {
                enabled: false,
                apiKey: undefined,
                web: { enabled: false },
                images: { enabled: false },
                news: { enabled: false },
                places: { enabled: false },
                shopping: { enabled: false },
                reviews: { enabled: false },
                videos: { enabled: false },
                webpageFetch: { enabled: false },
              },
              brave: {
                enabled: false,
                apiKey: undefined,
                web: { enabled: false },
                images: { enabled: false },
                news: { enabled: false },
                video: { enabled: false },
              },
              searxng: { enabled: false, url: undefined },
              browserBase: {
                enabled: false,
                apiKey: undefined,
                search: { enabled: false },
                fetch: { enabled: false },
              },
            }),
          },
        },
        {
          provide: AiSdkService,
          useValue: {
            compactContent: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ToolSelectionService>(ToolSelectionService);
    providerOverrides = module.get<ProviderOverridesService>(
      ProviderOverridesService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('selects only valid tools', () => {
    const tools = service.selectToolsByName(
      ['webFetch', 'unknownTool'] as any,
      undefined,
      undefined,
    );

    expect(tools.webFetch).toBeDefined();
    expect(tools.unknownTool).toBeUndefined();
    expect(providerOverrides.getConfig).toHaveBeenCalled();
  });

  it('returns empty object when all selected tools are invalid', () => {
    const tools = service.selectToolsByName(['unknownTool'] as any);
    expect(Object.keys(tools)).toHaveLength(0);
  });

  it('emits a summarized result on tool done', async () => {
    const onToolEvent = vi.fn();
    const fakeExecute = vi
      .fn()
      .mockResolvedValue({ results: [{ source: 'test' }] });
    const fakeSummarize = vi
      .fn()
      .mockReturnValue({ resultCount: 1, sources: ['test'] });

    vi.spyOn(service, 'getDefaultTools').mockReturnValue({
      fakeTool: {
        description: 'fake',
        parameters: {},
        execute: fakeExecute,
        summarize: fakeSummarize,
      } as any,
    });

    const tools = service.selectToolsByName(
      ['fakeTool'] as any,
      undefined,
      onToolEvent,
    );
    const result = await (tools.fakeTool as any).execute({ input: 'x' });

    expect(fakeExecute).toHaveBeenCalledWith({ input: 'x' });
    expect(fakeSummarize).toHaveBeenCalledWith({
      results: [{ source: 'test' }],
    });
    expect(onToolEvent).toHaveBeenCalledWith({
      name: 'fakeTool',
      status: 'done',
      result: { resultCount: 1, sources: ['test'] },
    });
    expect(result).toEqual({ results: [{ source: 'test' }] });
  });

  it('emits an error summary when the tool result contains an error', async () => {
    const onToolEvent = vi.fn();
    const fakeExecute = vi.fn().mockResolvedValue({ error: 'boom' });

    vi.spyOn(service, 'getDefaultTools').mockReturnValue({
      fakeTool: {
        description: 'fake',
        parameters: {},
        execute: fakeExecute,
      } as any,
    });

    const tools = service.selectToolsByName(
      ['fakeTool'] as any,
      undefined,
      onToolEvent,
    );
    await (tools.fakeTool as any).execute({});

    expect(onToolEvent).toHaveBeenCalledWith({
      name: 'fakeTool',
      status: 'done',
      result: { error: 'boom' },
    });
  });

  it('falls back to an empty summary when the tool has no summarizer', async () => {
    const onToolEvent = vi.fn();
    const fakeExecute = vi.fn().mockResolvedValue({ unknown: 'shape' });

    vi.spyOn(service, 'getDefaultTools').mockReturnValue({
      fakeTool: {
        description: 'fake',
        parameters: {},
        execute: fakeExecute,
      } as any,
    });

    const tools = service.selectToolsByName(
      ['fakeTool'] as any,
      undefined,
      onToolEvent,
    );
    await (tools.fakeTool as any).execute({});

    expect(onToolEvent).toHaveBeenCalledWith({
      name: 'fakeTool',
      status: 'done',
      result: {},
    });
  });
});
