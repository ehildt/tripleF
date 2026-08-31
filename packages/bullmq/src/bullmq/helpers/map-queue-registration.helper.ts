import type { BullMQModuleProps, Queue } from '../bullmq.model.js';

/**
 * Build a BullMQ queue registration config for a single queue, merging the
 * queue's own connection (when provided) into the shared factory config.
 */
export function mapQueueRegistration(queue: Queue, options: BullMQModuleProps) {
  const queueName = typeof queue === 'string' ? queue : queue.name;
  const queueConnection = typeof queue === 'object' ? queue.connection : undefined;

  return {
    name: queueName,
    global: options.global,
    inject: options.inject,
    useFactory: async (...deps: any[]) => {
      return {
        ...((await options.useFactory(...deps)) ?? {}),
        ...(queueConnection && { connection: queueConnection }),
      };
    },
  };
}
