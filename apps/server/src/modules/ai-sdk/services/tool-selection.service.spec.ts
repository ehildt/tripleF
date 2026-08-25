import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';

import { MEMORY_CLIENT_CONFIG } from '../../memory-client/constants/memory-client.constants.js';
import { MemoryClientService } from '../../memory-client/services/memory-client.service.js';
import { PlaywrightMcpClientService } from '../../playwright-mcp/services/playwright-mcp-client.service.js';
import { ProviderOverridesService } from '../../provider-overrides/services/provider-overrides.service.js';
import { StockHistoryService } from '../../stock-data/services/stock-history.service.js';

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
                scrape: { enabled: false },
              },
              youtube: {
                enabled: false,
                apiKey: undefined,
                videos: { enabled: false },
              },
              brightData: {
                enabled: false,
                apiKey: undefined,
                serpZone: undefined,
                web: { enabled: false },
                images: { enabled: false },
                news: { enabled: false },
                places: { enabled: false },
                shopping: { enabled: false },
                videos: { enabled: false },
                scrape: { enabled: false },
              },
            }),
          },
        },
        {
          provide: StockHistoryService,
          useValue: {
            getHistory: vi.fn().mockResolvedValue([]),
          },
        },
        {
          provide: PlaywrightMcpClientService,
          useValue: { tools: {} },
        },
        {
          provide: MemoryClientService,
          useValue: {
            storeRecord: vi.fn(),
            searchByText: vi.fn(),
            deleteRecords: vi.fn(),
            deleteCognition: vi.fn(),
          },
        },
        {
          provide: MEMORY_CLIENT_CONFIG,
          useValue: { url: 'http://memory:3400', enabled: false },
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
