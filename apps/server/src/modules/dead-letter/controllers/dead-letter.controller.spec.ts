import { describe, expect, it, vi } from 'vitest';

import { JobReinstatementService } from '../../minio/services/job-reinstatement.service.js';
import { MinioService } from '../../minio/services/minio.service.js';
import { DlqEventsService } from '../services/dlq-events.service.js';
import { DeadLetterRepository } from '../services/repository.service.js';

import { DeadLetterController } from './dead-letter.controller.js';

describe('DeadLetterController', () => {
  function makeController() {
    const repository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsertByQueueJob: vi.fn(),
      remove: vi.fn(),
      findEligible: vi.fn(),
      hardDeleteMany: vi.fn(),
      moveStatus: vi.fn(),
      config: {
        failed: { retainAmount: 1, maxAgeMs: 1 },
        cleared: { retainAmount: 1, maxAgeMs: 1 },
        removed: { retainAmount: 1, maxAgeMs: 1 },
      },
    };

    const minioService = { deleteBuffers: vi.fn() };
    const reinstatement = { reinstate: vi.fn() };
    const events = {
      broadcastEntryUpserted: vi.fn(),
      broadcastEntriesRemoved: vi.fn(),
      broadcastBulkChanged: vi.fn(),
    };

    const controller = new DeadLetterController(
      repository as unknown as DeadLetterRepository,
      minioService as unknown as MinioService,
      reinstatement as unknown as JobReinstatementService,
      events as unknown as DlqEventsService,
    );

    return { controller, repository, minioService, reinstatement, events };
  }

  it('findAll delegates to the repository without broadcasting', async () => {
    const { controller, repository, events } = makeController();
    repository.findAll.mockResolvedValue([]);

    await controller.findAll({} as never);

    expect(repository.findAll).toHaveBeenCalled();
    expect(events.broadcastEntryUpserted).not.toHaveBeenCalled();
    expect(events.broadcastEntriesRemoved).not.toHaveBeenCalled();
    expect(events.broadcastBulkChanged).not.toHaveBeenCalled();
  });

  it('create persists and broadcasts the upserted row', async () => {
    const { controller, repository, events } = makeController();
    repository.create.mockResolvedValue({ id: '1' });

    const result = await controller.create({
      queueName: 'harness',
      jobId: 'j1',
      jobName: 'req-1',
      status: 'Failed',
      payload: {},
    } as never);

    expect(repository.create).toHaveBeenCalled();
    expect(events.broadcastEntryUpserted).toHaveBeenCalledWith({ id: '1' });
    expect(result).toEqual({ id: '1' });
  });

  it('update persists and broadcasts the upserted row', async () => {
    const { controller, repository, events } = makeController();
    repository.findById.mockResolvedValue({ id: '1', status: 'Failed' });
    repository.update.mockResolvedValue({ id: '1', status: 'Cleared' });

    await controller.update(
      { id: '1' } as never,
      {
        status: 'Cleared',
      } as never,
    );

    expect(repository.update).toHaveBeenCalled();
    expect(events.broadcastEntryUpserted).toHaveBeenCalledWith({
      id: '1',
      status: 'Cleared',
    });
  });

  it('update throws when the entry is missing and never broadcasts', async () => {
    const { controller, repository, events } = makeController();
    repository.findById.mockResolvedValue(null);

    await expect(
      controller.update({ id: 'missing' } as never, {} as never),
    ).rejects.toThrow();

    expect(events.broadcastEntryUpserted).not.toHaveBeenCalled();
  });

  it('upsert persists and broadcasts the upserted row', async () => {
    const { controller, repository, events } = makeController();
    repository.findById.mockResolvedValue({
      id: '1',
      status: 'Failed',
      queueName: 'harness',
      jobId: 'j1',
      jobName: 'req-1',
    });
    repository.upsertByQueueJob.mockResolvedValue({ id: '1' });

    await controller.upsert(
      { id: '1' } as never,
      {
        status: 'Failed',
      } as never,
    );

    expect(repository.upsertByQueueJob).toHaveBeenCalled();
    expect(events.broadcastEntryUpserted).toHaveBeenCalledWith({ id: '1' });
  });

  it('remove persists the status move and broadcasts the upserted row', async () => {
    const { controller, repository, events } = makeController();
    repository.findById.mockResolvedValue({ id: '1' });
    repository.remove.mockResolvedValue({ id: '1', status: 'Removed' });

    await controller.remove({ id: '1' } as never);

    expect(repository.remove).toHaveBeenCalledWith('1');
    expect(events.broadcastEntryUpserted).toHaveBeenCalledWith({
      id: '1',
      status: 'Removed',
    });
  });

  it('reinstate delegates and broadcasts a bulk change', async () => {
    const { controller, reinstatement, events } = makeController();
    reinstatement.reinstate.mockResolvedValue({ restored: 1 });

    await controller.reinstate(
      { batchSize: 5 } as never,
      {
        ids: ['1'],
      } as never,
    );

    expect(reinstatement.reinstate).toHaveBeenCalledWith({
      ids: ['1'],
      batchSize: 5,
    });
    expect(events.broadcastBulkChanged).toHaveBeenCalledTimes(1);
    expect(events.broadcastEntryUpserted).not.toHaveBeenCalled();
  });

  it('cleanup broadcasts a bulk change but no removals when nothing is erased', async () => {
    const { controller, repository, events } = makeController();
    repository.findEligible.mockResolvedValue([]);
    repository.hardDeleteMany.mockResolvedValue({ count: 0 });

    await controller.cleanup();

    expect(repository.hardDeleteMany).toHaveBeenCalled();
    expect(repository.moveStatus).toHaveBeenCalledTimes(2);
    expect(events.broadcastEntriesRemoved).not.toHaveBeenCalled();
    expect(events.broadcastBulkChanged).toHaveBeenCalledTimes(1);
  });

  it('cleanup reports the hard-deleted ids and the bulk status moves', async () => {
    const { controller, repository, events } = makeController();
    repository.findEligible.mockImplementation(async (status: string) =>
      status === 'Removed'
        ? [{ id: 'r1', queueName: 'harness', jobName: 'req-1' }]
        : [],
    );
    repository.hardDeleteMany.mockResolvedValue({ count: 1 });

    await controller.cleanup();

    expect(events.broadcastEntriesRemoved).toHaveBeenCalledWith(['r1']);
    expect(events.broadcastBulkChanged).toHaveBeenCalledTimes(1);
  });
});
