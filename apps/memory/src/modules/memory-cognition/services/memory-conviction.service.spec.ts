import { describe, expect, it, vi } from 'vitest';

import { MemoryConvictionService } from './memory-conviction.service.js';

function makeService() {
  const aiSdkService = { generateChat: vi.fn() };
  const ollamaConfigService = { config: { keepAlive: '5m' } };
  const embeddingService = { embed: vi.fn() };
  const memoryRepository = {
    scrollSynthesizable: vi.fn(),
    scrollBridges: vi.fn().mockResolvedValue([]),
    scrollConvictions: vi.fn().mockResolvedValue([]),
    retrieveSupersededState: vi.fn().mockResolvedValue([]),
    setPayloadForPoints: vi.fn(),
    upsertBatch: vi.fn(),
  };
  const memoryCognition = {
    upsertConvictions: vi.fn().mockResolvedValue(0),
  };
  const memoryEnqueue = { enqueueClusterJob: vi.fn() };
  const overrides = { getClusterAutoEnabled: vi.fn().mockReturnValue(false) };
  const service = new MemoryConvictionService(
    aiSdkService as never,
    ollamaConfigService as never,
    embeddingService as never,
    memoryRepository as never,
    memoryCognition as never,
    memoryEnqueue as never,
    overrides as never,
  );
  return {
    service,
    aiSdkService,
    embeddingService,
    memoryRepository,
    memoryCognition,
    memoryEnqueue,
    overrides,
  };
}

const jobData = {
  memoryPartition: 'christopher',
  model: 'qwen3.8:27b',
};

const evidence = [
  {
    id: 'a',
    vector: [1, 0, 0],
    text: 'I am learning Rust',
    role: 'user' as const,
    createdAt: '2026-01-01T00:00:00.000Z',
    category: 'work',
  },
  {
    id: 'b',
    vector: [0, 1, 0],
    text: 'I am rewriting the payments service',
    role: 'user' as const,
    createdAt: '2026-01-02T00:00:00.000Z',
    category: 'work',
  },
];

describe('MemoryConvictionService', () => {
  it('does nothing when no evidence is synthesizable', async () => {
    const { service, aiSdkService, memoryRepository } = makeService();
    memoryRepository.scrollSynthesizable.mockResolvedValue([]);

    await service.execute(jobData);

    expect(aiSdkService.generateChat).not.toHaveBeenCalled();
  });

  it('synthesizes bridges and stores them linked, with evidence back-references', async () => {
    const { service, aiSdkService, embeddingService, memoryRepository } =
      makeService();
    memoryRepository.scrollSynthesizable.mockResolvedValue(evidence);
    aiSdkService.generateChat.mockResolvedValue({
      text: JSON.stringify({
        convictions: [
          {
            text: 'The user is migrating to Rust',
            target: 'bridge',
            evidence: [0, 1],
          },
        ],
      }),
    });
    embeddingService.embed.mockResolvedValue([[1, 0, 0]]);

    await service.execute(jobData);

    expect(memoryRepository.upsertBatch).toHaveBeenCalledWith(
      expect.objectContaining({
        memoryPartition: 'christopher',
        points: [
          expect.objectContaining({
            text: 'The user is migrating to Rust',
            tags: ['bridge'],
            evidenceIds: ['a', 'b'],
          }),
        ],
      }),
    );
    expect(memoryRepository.setPayloadForPoints).toHaveBeenCalledWith(
      ['a', 'b'],
      { is_synthesized: true },
    );
  });

  it('synthesizes convictions into the cognition scope', async () => {
    const {
      service,
      aiSdkService,
      embeddingService,
      memoryRepository,
      memoryCognition,
    } = makeService();
    memoryRepository.scrollSynthesizable.mockResolvedValue(evidence);
    aiSdkService.generateChat.mockResolvedValue({
      text: JSON.stringify({
        convictions: [
          {
            text: 'The user is a deliberate, research-first buyer',
            target: 'conviction',
            evidence: [0, 1],
          },
        ],
      }),
    });
    memoryCognition.upsertConvictions.mockResolvedValue(1);

    await service.execute(jobData);

    expect(memoryRepository.upsertBatch).not.toHaveBeenCalled();
    expect(memoryCognition.upsertConvictions).toHaveBeenCalledWith(
      { memoryCognition: 'christopher' },
      [
        {
          text: 'The user is a deliberate, research-first buyer',
          evidenceIds: ['a', 'b'],
        },
      ],
    );
    expect(embeddingService.embed).not.toHaveBeenCalled();
  });

  it('marks evidence synthesized when the verdict yields no statements', async () => {
    const { service, aiSdkService, memoryRepository } = makeService();
    memoryRepository.scrollSynthesizable.mockResolvedValue(evidence);
    aiSdkService.generateChat.mockResolvedValue({
      text: JSON.stringify({ convictions: [] }),
    });

    await service.execute(jobData);

    expect(memoryRepository.upsertBatch).not.toHaveBeenCalled();
    expect(memoryRepository.setPayloadForPoints).toHaveBeenCalledWith(
      ['a', 'b'],
      { is_synthesized: true },
    );
  });

  it('leaves evidence synthesizable on an unparseable verdict', async () => {
    const { service, aiSdkService, memoryRepository } = makeService();
    memoryRepository.scrollSynthesizable.mockResolvedValue(evidence);
    aiSdkService.generateChat.mockResolvedValue({ text: 'not json' });

    await service.execute(jobData);

    expect(memoryRepository.upsertBatch).not.toHaveBeenCalled();
    expect(memoryRepository.setPayloadForPoints).not.toHaveBeenCalled();
  });

  it('applies nothing in dryRun mode', async () => {
    const { service, aiSdkService, memoryRepository } = makeService();
    memoryRepository.scrollSynthesizable.mockResolvedValue(evidence);
    aiSdkService.generateChat.mockResolvedValue({
      text: JSON.stringify({
        convictions: [
          {
            text: 'The user is migrating to Rust',
            target: 'bridge',
            evidence: [0, 1],
          },
        ],
      }),
    });

    await service.execute({ ...jobData, dryRun: true });

    expect(memoryRepository.upsertBatch).not.toHaveBeenCalled();
    expect(memoryRepository.setPayloadForPoints).not.toHaveBeenCalled();
  });

  it('caps the per-run evidence limit at 500', async () => {
    const { service, memoryRepository } = makeService();
    memoryRepository.scrollSynthesizable.mockResolvedValue([]);

    await service.execute({ ...jobData, limit: 10000 });

    expect(memoryRepository.scrollSynthesizable).toHaveBeenCalledWith({
      memoryPartition: 'christopher',
      limit: 500,
    });
  });

  it('supersedes a statement whose evidence is missing and re-offers surviving evidence', async () => {
    const { service, memoryRepository } = makeService();
    memoryRepository.scrollBridges.mockResolvedValue([
      { id: 'bridge-1', evidenceIds: ['a', 'b'] },
    ]);
    // 'a' is missing from the retrieve result; 'b' survives.
    memoryRepository.retrieveSupersededState.mockResolvedValue([
      { id: 'b', superseded: false },
    ]);
    memoryRepository.scrollSynthesizable.mockResolvedValue([]);

    await service.execute(jobData);

    expect(memoryRepository.setPayloadForPoints).toHaveBeenCalledWith(
      ['bridge-1'],
      { superseded: true },
    );
    expect(memoryRepository.setPayloadForPoints).toHaveBeenCalledWith(['b'], {
      is_synthesized: false,
    });
  });

  it('supersedes a statement whose evidence is superseded', async () => {
    const { service, memoryRepository } = makeService();
    memoryRepository.scrollBridges.mockResolvedValue([
      { id: 'bridge-1', evidenceIds: ['a', 'b'] },
    ]);
    memoryRepository.retrieveSupersededState.mockResolvedValue([
      { id: 'a', superseded: true },
      { id: 'b', superseded: false },
    ]);
    memoryRepository.scrollSynthesizable.mockResolvedValue([]);

    await service.execute(jobData);

    expect(memoryRepository.setPayloadForPoints).toHaveBeenCalledWith(
      ['bridge-1'],
      { superseded: true },
    );
    expect(memoryRepository.setPayloadForPoints).toHaveBeenCalledWith(['b'], {
      is_synthesized: false,
    });
  });

  it('supersedes a stale conviction found by the drift sweep', async () => {
    const { service, memoryRepository } = makeService();
    memoryRepository.scrollConvictions.mockResolvedValue([
      { id: 'conviction-1', evidenceIds: ['a'] },
    ]);
    memoryRepository.retrieveSupersededState.mockResolvedValue([]);
    memoryRepository.scrollSynthesizable.mockResolvedValue([]);

    await service.execute(jobData);

    expect(memoryRepository.setPayloadForPoints).toHaveBeenCalledWith(
      ['conviction-1'],
      { superseded: true },
    );
  });

  it('leaves a healthy statement untouched', async () => {
    const { service, memoryRepository } = makeService();
    memoryRepository.scrollBridges.mockResolvedValue([
      { id: 'bridge-1', evidenceIds: ['a', 'b'] },
    ]);
    memoryRepository.retrieveSupersededState.mockResolvedValue([
      { id: 'a', superseded: false },
      { id: 'b', superseded: false },
    ]);
    memoryRepository.scrollSynthesizable.mockResolvedValue([]);

    await service.execute(jobData);

    expect(memoryRepository.setPayloadForPoints).not.toHaveBeenCalled();
  });

  it('skips the drift sweep in dryRun mode', async () => {
    const { service, memoryRepository } = makeService();
    memoryRepository.scrollSynthesizable.mockResolvedValue([]);

    await service.execute({ ...jobData, dryRun: true });

    expect(memoryRepository.scrollBridges).not.toHaveBeenCalled();
    expect(memoryRepository.scrollConvictions).not.toHaveBeenCalled();
  });
});
