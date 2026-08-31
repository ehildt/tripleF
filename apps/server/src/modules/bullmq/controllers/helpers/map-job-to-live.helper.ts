import type { Job } from 'bullmq';

/** Project a BullMQ job into the live-jobs endpoint shape. */
export function mapJobToLive(j: Job) {
  return {
    id: j.id,
    name: j.name,
    state: j.getState(),
    attemptsMade: j.attemptsMade,
  };
}
