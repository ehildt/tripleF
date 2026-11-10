import { z } from 'zod';

export const commonDlqSchema = z.object({
  failedReason: z.string(),
  payload: z.string(),
  poisonPill: z.string(),
  attemptsCount: z.string().optional(),
  perPage: z.string().optional(),
  filterByStatus: z.string().optional(),
  firstPage: z.string().optional(),
  lastPage: z.string().optional(),
  nextPage: z.string().optional(),
  previousPage: z.string().optional(),
  noFailedJobs: z.string().optional(),
  noUnreadJobs: z.string().optional(),
  gotYouBro: z.string().optional(),
  attempts: z.string().optional(),
  created: z.string().optional(),
  details: z.string().optional(),
  failedAt: z.string().optional(),
  jobId: z.string().optional(),
  jobs: z.string().optional(),
  retryAt: z.string().optional(),
  status: z.string().optional(),
  archive: z.string().optional(),
  cleared: z.string().optional(),
  failed: z.string().optional(),
  removed: z.string().optional(),
  failedLoadDlqEntries: z.string().optional(),
});

export type CommonDlqMessages = z.infer<typeof commonDlqSchema>;
