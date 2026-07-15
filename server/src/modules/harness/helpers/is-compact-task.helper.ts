import { Job } from 'bullmq';

import type { HarnessJobPayload } from '../dtos/harness-job.dto.js';

export function isCompactTask(job: Job<HarnessJobPayload>): boolean {
  return job.data.filters.compact === true;
}
