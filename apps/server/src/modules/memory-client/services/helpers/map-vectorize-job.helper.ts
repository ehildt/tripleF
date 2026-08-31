import { VECTORIZE_JOB } from '../../constants/memory-client.constants.js';
import type { VectorizeJobData } from '../../models/vectorize-job.model.js';

/** Wrap a vectorize payload into a BullMQ job descriptor. */
export function mapVectorizeJob(data: VectorizeJobData) {
  return { name: VECTORIZE_JOB, data };
}
