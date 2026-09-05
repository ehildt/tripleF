import { VECTORIZE_JOB } from '../../qdrant/constants/qdrant.constants.js';
import type { VectorizeJobData } from '../../qdrant/models/memory.model.js';

/** Wrap a vectorize payload into a BullMQ job descriptor. */
export function mapVectorizeJob(data: VectorizeJobData) {
  return { name: VECTORIZE_JOB, data };
}
