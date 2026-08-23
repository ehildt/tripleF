export type FindAllOptions = {
  status?: string;
  queueName?: string;
  nextRetryAtBefore?: Date;
  nextRetryAtAfter?: Date;
  limit?: number;
  offset?: number;
  jobName?: string;
  search?: string;
};
