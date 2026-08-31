import { describe, expect, it } from 'vitest';

import type { BullMQModuleProps } from '../bullmq.model.js';

import { mapQueueRegistration } from './map-queue-registration.helper.js';

const baseOptions: BullMQModuleProps = {
  inject: ['CONFIG_TOKEN'],
  queues: [],
  processors: [],
  useFactory: async () => ({ connection: { host: 'default' } }),
};

describe('mapQueueRegistration', () => {
  it('maps a string queue to a registration config', () => {
    const config = mapQueueRegistration('my-queue', baseOptions);
    expect(config.name).toBe('my-queue');
    expect(config.inject).toEqual(['CONFIG_TOKEN']);
  });

  it('maps an object queue with its connection', async () => {
    const config = mapQueueRegistration({ name: 'my-queue', connection: { host: 'queue-host' } }, baseOptions);
    expect(config.name).toBe('my-queue');
    const result = await config.useFactory();
    expect(result).toMatchObject({ connection: { host: 'queue-host' } });
  });

  it('merges the shared factory config with the queue connection', async () => {
    const config = mapQueueRegistration(
      { name: 'my-queue', connection: { host: 'queue-host' } },
      {
        ...baseOptions,
        useFactory: async () => ({ defaultJobOptions: { delay: 1 } }),
      },
    );
    const result = await config.useFactory();
    expect(result).toMatchObject({
      connection: { host: 'queue-host' },
      defaultJobOptions: { delay: 1 },
    });
  });
});
