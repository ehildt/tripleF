import { VECTORIZE_JOB } from '../../constants/memory-client.constants.js';
import type { VectorizeJobData } from '../memory-enqueue.service.types.js';

/** Wrap a vectorize payload into a BullMQ job descriptor. */
export function mapVectorizeJob(data: VectorizeJobData) {
  return { name: VECTORIZE_JOB, data };
}
