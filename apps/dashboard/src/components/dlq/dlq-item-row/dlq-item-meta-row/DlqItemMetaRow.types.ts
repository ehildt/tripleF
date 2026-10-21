export interface DlqItemMetaRowProps {
  /** Name of the queue the failed job belongs to. */
  queueName: string;
  /** How many attempts the job already consumed. */
  attemptsMade: number;
  /** How many attempts the job was allowed in total. */
  totalAttempts: number;
  /** ISO timestamp of the last failure, or null when unknown. */
  failedAt: string | null;
}
