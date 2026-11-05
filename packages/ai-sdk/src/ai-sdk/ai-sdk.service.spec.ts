import { generateText, pruneMessages, smoothStream, stepCountIs, streamText } from 'ai';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AiSdkConfig } from './ai-sdk.model.ts';
import { AiSdkService } from './ai-sdk.service.ts';

vi.mock('ai', () => ({
  generateText: vi.fn(),
  streamText: vi.fn(),
  smoothStream: vi.fn(() => 'smooth-stream-transform'),
  pruneMessages: vi.fn(({ messages }: { messages: unknown[] }) => ['pruned', ...messages]),
  stepCountIs: vi.fn((count: number) => `step-limit:${count}`),
}));

const generateTextMock = vi.mocked(generateText);
const streamTextMock = vi.mocked(streamText);
const smoothStreamMock = vi.mocked(smoothStream);
const pruneMessagesMock = vi.mocked(pruneMessages);
const stepCountIsMock = vi.mocked(stepCountIs);

const createModel = vi.fn((modelName: string) => ({ modelName }) as any);

const baseConfig: AiSdkConfig = {
  streamChunkTimeoutMs: 1_000,
  streamTotalTimeoutMs: 10_000,
  generateTotalTimeoutMs: 5_000,
  enableSmoothStream: true,
  createModel,
};

const buildService = (overrides: Partial<AiSdkConfig> = {}) => new AiSdkService({ ...baseConfig, ...overrides });

const defaultMessages = [
  { role: 'system' as const, content: 'Be concise' },
  { role: 'user' as const, content: 'hello' },
];

describe('AiSdkService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createModel.mockImplementation((modelName: string) => ({ modelName }) as any);
    smoothStreamMock.mockReturnValue('smooth-stream-transform' as any);
    pruneMessagesMock.mockImplementation(({ messages }: { messages: unknown[] }) => ['pruned', ...messages] as any);
    stepCountIsMock.mockImplementation((count: number) => `step-limit:${count}` as any);
    generateTextMock.mockResolvedValue({ text: 'answer', usage: undefined } as any);
    streamTextMock.mockReturnValue({ textStream: 'stream' } as any);
  });

  describe('streamChat', () => {
    it('uses config stream timeouts when none are passed', async () => {
      const service = buildService();

      await service.streamChat({ model: 'llama', messages: defaultMessages });

      expect(streamTextMock.mock.calls[0][0]).toMatchObject({
        timeout: { totalMs: 10_000, chunkMs: 1_000 },
      });
    });

    it('prefers an explicit timeout over the configured defaults', async () => {
      const service = buildService();
      const timeout = { totalMs: 1, chunkMs: 2 } as any;

      await service.streamChat({ model: 'llama', messages: defaultMessages, timeout });

      expect(streamTextMock.mock.calls[0][0]).toMatchObject({ timeout });
    });

    it('enables the smooth stream transform when the config enables it', async () => {
      const service = buildService({ enableSmoothStream: true });

      await service.streamChat({ model: 'llama', messages: defaultMessages });

      expect(smoothStreamMock).toHaveBeenCalledWith({ delayInMs: 10, chunking: 'word' });
      expect(streamTextMock.mock.calls[0][0]).toMatchObject({
        experimental_transform: 'smooth-stream-transform',
      });
    });

    it('lets an explicit smoothStream flag override the config', async () => {
      const service = buildService({ enableSmoothStream: true });

      await service.streamChat({ model: 'llama', messages: defaultMessages, smoothStream: false });

      expect(smoothStreamMock).not.toHaveBeenCalled();
      expect(streamTextMock.mock.calls[0][0]).not.toHaveProperty('experimental_transform');
    });

    it('omits the transform when neither config nor caller enables it', async () => {
      const service = buildService({ enableSmoothStream: false });

      await service.streamChat({ model: 'llama', messages: defaultMessages });

      expect(smoothStreamMock).not.toHaveBeenCalled();
      expect(streamTextMock.mock.calls[0][0]).not.toHaveProperty('experimental_transform');
    });

    it('passes the converted messages, model, tools and step limit through', async () => {
      const service = buildService();
      const tools = { search: {} } as any;
      const abortSignal = new AbortController().signal;

      await service.streamChat({
        model: 'llama',
        messages: defaultMessages,
        tools,
        abortSignal,
        providerOptions: { ollama: { think: false } },
      });

      expect(createModel).toHaveBeenCalledWith('llama');
      expect(streamTextMock.mock.calls[0][0]).toMatchObject({
        model: { modelName: 'llama' },
        system: 'Be concise',
        messages: [{ role: 'user', content: 'hello' }],
        tools,
        allowSystemInMessages: false,
        stopWhen: 'step-limit:5',
        abortSignal,
        providerOptions: { ollama: { think: false } },
      });
    });
  });

  describe('generateChat', () => {
    it('uses the config generate timeout when none is passed', async () => {
      const service = buildService();

      await service.generateChat({ model: 'llama', messages: defaultMessages });

      expect(generateTextMock.mock.calls[0][0]).toMatchObject({ timeout: 5_000 });
    });

    it('prefers an explicit timeout', async () => {
      const service = buildService();
      const timeout = { totalMs: 42 } as any;

      await service.generateChat({ model: 'llama', messages: defaultMessages, timeout });

      expect(generateTextMock.mock.calls[0][0]).toMatchObject({ timeout });
    });

    it('passes converted messages and a fixed five-step limit', async () => {
      const service = buildService();

      await service.generateChat({ model: 'llama', messages: defaultMessages });

      expect(createModel).toHaveBeenCalledWith('llama');
      expect(generateTextMock.mock.calls[0][0]).toMatchObject({
        system: 'Be concise',
        messages: [{ role: 'user', content: 'hello' }],
        allowSystemInMessages: false,
        stopWhen: 'step-limit:5',
      });
    });
  });

  describe('generateWithTools', () => {
    it('defaults to one step and requires a tool call when tools exist', async () => {
      const service = buildService();

      await service.generateWithTools({
        model: 'llama',
        messages: defaultMessages,
        tools: { search: {} } as any,
      });

      expect(stepCountIsMock).toHaveBeenCalledWith(1);
      expect(generateTextMock.mock.calls[0][0]).toMatchObject({ toolChoice: 'required' });
    });

    it('omits toolChoice when no tools are provided', async () => {
      const service = buildService();

      await service.generateWithTools({ model: 'llama', messages: defaultMessages, tools: {} });

      expect(generateTextMock.mock.calls[0][0]).not.toHaveProperty('toolChoice');
      expect(generateTextMock.mock.calls[0][0]).not.toHaveProperty('prepareStep');
    });

    it('honours an explicit toolChoice', async () => {
      const service = buildService();

      await service.generateWithTools({
        model: 'llama',
        messages: defaultMessages,
        tools: { search: {} } as any,
        toolChoice: 'auto',
      });

      expect(generateTextMock.mock.calls[0][0]).toMatchObject({ toolChoice: 'auto' });
    });

    it('does not install prepareStep for a single-step chain', async () => {
      const service = buildService();

      await service.generateWithTools({
        model: 'llama',
        messages: defaultMessages,
        tools: { search: {} } as any,
        maxSteps: 1,
      });

      expect(generateTextMock.mock.calls[0][0]).not.toHaveProperty('prepareStep');
    });

    it('returns no toolChoice override on the first step of a chained run', async () => {
      const service = buildService();

      await service.generateWithTools({
        model: 'llama',
        messages: defaultMessages,
        tools: { search: {} } as any,
        maxSteps: 3,
      });

      const { prepareStep } = generateTextMock.mock.calls[0][0] as any;
      expect(prepareStep({ steps: [], messages: ['m'] })).toEqual({});
    });

    it('relaxes toolChoice and prunes reasoning on follow-up chained steps', async () => {
      const service = buildService();

      await service.generateWithTools({
        model: 'llama',
        messages: defaultMessages,
        tools: { search: {} } as any,
        maxSteps: 3,
      });

      const { prepareStep } = generateTextMock.mock.calls[0][0] as any;
      expect(prepareStep({ steps: ['first'], messages: ['m1', 'm2'] })).toEqual({
        toolChoice: 'auto',
        messages: ['pruned', 'm1', 'm2'],
      });
      expect(pruneMessagesMock).toHaveBeenCalledWith({
        messages: ['m1', 'm2'],
        reasoning: 'all',
      });
    });

    it('keeps an explicit caller toolChoice across chained steps', async () => {
      const service = buildService();

      await service.generateWithTools({
        model: 'llama',
        messages: defaultMessages,
        tools: { search: {} } as any,
        maxSteps: 3,
        toolChoice: 'required',
      });

      const { prepareStep } = generateTextMock.mock.calls[0][0] as any;
      expect(prepareStep({ steps: ['first'], messages: ['m'] })).toEqual({
        messages: ['pruned', 'm'],
      });
    });

    it('captures tool results and notifies the caller', async () => {
      generateTextMock.mockImplementation(async (options: any): Promise<any> => {
        options.onStepEnd({
          toolResults: [
            { toolName: 'search', output: { hits: 1 } },
            { toolName: 'browser', output: 'page' },
          ],
        });
        return { text: 'answer', usage: undefined };
      });
      const service = buildService();
      const onToolResult = vi.fn();

      const result = await service.generateWithTools({
        model: 'llama',
        messages: defaultMessages,
        tools: { search: {} } as any,
        onToolResult,
      });

      expect(result.toolResults).toEqual([
        { toolName: 'search', result: { hits: 1 } },
        { toolName: 'browser', result: 'page' },
      ]);
      expect(onToolResult).toHaveBeenCalledTimes(2);
      expect(onToolResult).toHaveBeenNthCalledWith(1, { toolName: 'search', result: { hits: 1 } });
      expect(onToolResult).toHaveBeenNthCalledWith(2, { toolName: 'browser', result: 'page' });
    });

    it('skips results without output and steps without toolResults', async () => {
      generateTextMock.mockImplementation(async (options: any): Promise<any> => {
        options.onStepEnd({
          toolResults: [{ toolName: 'empty' }, { toolName: 'zero', output: 0 }],
        });
        options.onStepEnd({});
        options.onStepEnd({ toolResults: undefined });
        return { text: 'answer', usage: undefined };
      });
      const service = buildService();
      const onToolResult = vi.fn();

      const result = await service.generateWithTools({
        model: 'llama',
        messages: defaultMessages,
        tools: { search: {} } as any,
        onToolResult,
      });

      expect(onToolResult).not.toHaveBeenCalled();
      expect(result.toolResults).toEqual([]);
    });

    it('tolerates a step result that exposes no toolResults array', async () => {
      const service = buildService();

      await service.generateWithTools({
        model: 'llama',
        messages: defaultMessages,
        tools: { search: {} } as any,
      });

      const { onStepEnd } = generateTextMock.mock.calls[0][0] as any;

      expect(() => onStepEnd({ toolResults: undefined })).not.toThrow();
    });

    it('maps usage when the SDK reports it', async () => {
      generateTextMock.mockResolvedValue({
        text: 'final',
        usage: { inputTokens: 10, outputTokens: 3 },
      } as any);
      const service = buildService();

      const result = await service.generateWithTools({
        model: 'llama',
        messages: defaultMessages,
        tools: { search: {} } as any,
      });

      expect(result).toEqual({
        text: 'final',
        toolResults: [],
        usage: { inputTokens: 10, outputTokens: 3 },
      });
    });

    it('returns undefined usage when the SDK reports none', async () => {
      generateTextMock.mockResolvedValue({ text: 'final' } as any);
      const service = buildService();

      const result = await service.generateWithTools({
        model: 'llama',
        messages: defaultMessages,
        tools: { search: {} } as any,
      });

      expect(result.usage).toBeUndefined();
    });
  });
});
