import { describe, expect, it, vi } from 'vitest';

import { EncyclopediaClassifyService } from './encyclopedia-classify.service.js';

function makeService() {
  const aiSdkService = { generateChat: vi.fn() };
  const ledger = {
    listPendingClassification: vi.fn(),
    markClassified: vi.fn(),
  };
  const repository = {
    facetCategories: vi.fn().mockResolvedValue([]),
    facetTopics: vi.fn().mockResolvedValue([]),
    scrollByUrl: vi.fn(),
    scrollUnclassifiedSnippetUrls: vi.fn().mockResolvedValue([]),
    scrollSnippetsByUrl: vi.fn(),
    setClassificationByUrl: vi.fn(),
  };
  const memoryEnqueue = {
    enqueueReflectJob: vi.fn(),
    enqueueClusterJob: vi.fn(),
  };
  const overrides = {
    getEncyclopediaReflectAutoEnabled: vi.fn(),
    getReflectModel: vi.fn(),
    getReflectBatchLimit: vi.fn(),
    getReflectMaxCandidates: vi.fn(),
    getClusterAutoEnabled: vi.fn().mockReturnValue(false),
    getClusterModel: vi.fn(),
    getClusterMinMembers: vi.fn(),
  };
  const service = new EncyclopediaClassifyService(
    aiSdkService as never,
    ledger as never,
    repository as never,
    memoryEnqueue as never,
    overrides as never,
  );
  return {
    service,
    aiSdkService,
    ledger,
    repository,
    memoryEnqueue,
    overrides,
  };
}

const jobData = { model: 'qwen3.8:27b' };

const pendingRow = {
  id: 'r1',
  url: 'https://example.com/a',
  contentHash: 'h1',
  chunkCount: 1,
  partitionScope: 'global',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

const chunk = {
  id: 'c1',
  content: 'Stellar Blade is an action game.',
  url: 'https://example.com/a',
  domain: 'example.com',
  title: 'Stellar Blade',
  fetchedAt: '2026-01-01T00:00:00.000Z',
  contentHash: 'h1',
  chunkIndex: 0,
  chunkCount: 1,
  partitionScope: 'global',
  sourceType: 'content' as const,
};

const classification = JSON.stringify({
  category: 'games',
  topic: 'stellar blade',
});

describe('EncyclopediaClassifyService', () => {
  it('does nothing when no documents are pending', async () => {
    const { service, aiSdkService, ledger } = makeService();
    ledger.listPendingClassification.mockResolvedValue([]);

    await service.execute(jobData);

    expect(aiSdkService.generateChat).not.toHaveBeenCalled();
  });

  it('classifies one document and fans labels out to its chunks', async () => {
    const { service, aiSdkService, ledger, repository } = makeService();
    ledger.listPendingClassification.mockResolvedValue([pendingRow]);
    repository.facetCategories.mockResolvedValue([
      { value: 'games', count: 1 },
    ]);
    repository.scrollByUrl.mockResolvedValue([chunk]);
    aiSdkService.generateChat.mockResolvedValue({ text: classification });

    await service.execute(jobData);

    expect(repository.setClassificationByUrl).toHaveBeenCalledWith(
      'https://example.com/a',
      'games',
      'stellar blade',
    );
    expect(ledger.markClassified).toHaveBeenCalledWith(['r1']);
  });

  it('dedupes multiple ledger rows for one url into a single LLM call', async () => {
    const { service, aiSdkService, ledger, repository } = makeService();
    const row2 = { ...pendingRow, id: 'r2' };
    ledger.listPendingClassification.mockResolvedValue([pendingRow, row2]);
    repository.facetCategories.mockResolvedValue([]);
    repository.scrollByUrl.mockResolvedValue([chunk]);
    aiSdkService.generateChat.mockResolvedValue({ text: classification });

    await service.execute(jobData);

    expect(aiSdkService.generateChat).toHaveBeenCalledTimes(1);
    expect(ledger.markClassified).toHaveBeenCalledWith(['r1', 'r2']);
  });

  it('leaves a document pending when the classification is unparseable', async () => {
    const { service, aiSdkService, ledger, repository } = makeService();
    ledger.listPendingClassification.mockResolvedValue([pendingRow]);
    repository.facetCategories.mockResolvedValue([]);
    repository.scrollByUrl.mockResolvedValue([chunk]);
    aiSdkService.generateChat.mockResolvedValue({ text: 'not json' });

    await service.execute(jobData);

    expect(repository.setClassificationByUrl).not.toHaveBeenCalled();
    expect(ledger.markClassified).not.toHaveBeenCalled();
  });

  it('marks a url classified when it has no stored chunks left', async () => {
    const { service, aiSdkService, ledger, repository } = makeService();
    ledger.listPendingClassification.mockResolvedValue([pendingRow]);
    repository.facetCategories.mockResolvedValue([]);
    repository.scrollByUrl.mockResolvedValue([]);

    await service.execute(jobData);

    expect(aiSdkService.generateChat).not.toHaveBeenCalled();
    expect(ledger.markClassified).toHaveBeenCalledWith(['r1']);
  });

  it('applies nothing in dryRun mode', async () => {
    const { service, aiSdkService, ledger, repository, memoryEnqueue } =
      makeService();
    ledger.listPendingClassification.mockResolvedValue([pendingRow]);
    repository.facetCategories.mockResolvedValue([]);
    repository.scrollByUrl.mockResolvedValue([chunk]);
    aiSdkService.generateChat.mockResolvedValue({ text: classification });

    await service.execute({ ...jobData, dryRun: true });

    expect(repository.setClassificationByUrl).not.toHaveBeenCalled();
    expect(ledger.markClassified).not.toHaveBeenCalled();
    expect(memoryEnqueue.enqueueReflectJob).not.toHaveBeenCalled();
  });

  it('auto-triggers reflection after a real run when enabled', async () => {
    const {
      service,
      aiSdkService,
      ledger,
      repository,
      memoryEnqueue,
      overrides,
    } = makeService();
    ledger.listPendingClassification.mockResolvedValue([pendingRow]);
    repository.facetCategories.mockResolvedValue([]);
    repository.scrollByUrl.mockResolvedValue([chunk]);
    aiSdkService.generateChat.mockResolvedValue({ text: classification });
    overrides.getEncyclopediaReflectAutoEnabled.mockReturnValue(true);
    overrides.getReflectModel.mockReturnValue(undefined);
    overrides.getReflectBatchLimit.mockReturnValue(100);
    overrides.getReflectMaxCandidates.mockReturnValue(5);

    await service.execute(jobData);

    expect(memoryEnqueue.enqueueReflectJob).toHaveBeenCalledWith({
      lane: 'encyclopedia',
      scopeKey: 'global',
      // Falls back to the classification model when no reflect model is set.
      model: 'qwen3.8:27b',
      limit: 100,
      maxCandidates: 5,
    });
  });

  it('skips the reflection auto-trigger when disabled', async () => {
    const {
      service,
      aiSdkService,
      ledger,
      repository,
      memoryEnqueue,
      overrides,
    } = makeService();
    ledger.listPendingClassification.mockResolvedValue([pendingRow]);
    repository.facetCategories.mockResolvedValue([]);
    repository.scrollByUrl.mockResolvedValue([chunk]);
    aiSdkService.generateChat.mockResolvedValue({ text: classification });
    overrides.getEncyclopediaReflectAutoEnabled.mockReturnValue(false);

    await service.execute(jobData);

    expect(memoryEnqueue.enqueueReflectJob).not.toHaveBeenCalled();
  });
});
