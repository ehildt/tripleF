import { Injectable } from '@nestjs/common';

type JobStatus = 'pending' | 'active' | 'completed' | 'canceled';

interface TrackedJob {
  queueName: string;
  jobId: string;
  requestId: string;
  status: JobStatus;
  addedAt: number;
}

@Injectable()
export class JobTrackingService {
  private readonly jobs = new Map<string, TrackedJob>();

  add(requestId: string, queueName: string, jobId: string): void {
    this.jobs.set(requestId, {
      queueName,
      jobId,
      requestId,
      status: 'pending',
      addedAt: Date.now(),
    });
  }

  setActive(requestId: string): void {
    const job = this.jobs.get(requestId);
    if (job && job.status !== 'canceled') {
      job.status = 'active';
    }
  }

  isCanceled(requestId: string): boolean {
    return this.jobs.get(requestId)?.status === 'canceled';
  }

  remove(requestId: string): void {
    this.jobs.delete(requestId);
  }

  get(requestId: string): TrackedJob | undefined {
    return this.jobs.get(requestId);
  }

  cancel(requestId: string): boolean {
    const existingJob = this.jobs.get(requestId);

    if (existingJob) {
      if (
        existingJob.status === 'completed' ||
        existingJob.status === 'canceled'
      ) {
        return false;
      }
      existingJob.status = 'canceled';
      return true;
    }

    // No existing job - create a new entry marked as canceled
    // This handles the case where cancel is called before job is even tracked
    this.jobs.set(requestId, {
      requestId,
      queueName: '',
      jobId: '',
      status: 'canceled',
      addedAt: Date.now(),
    });
    return true;
  }
}
