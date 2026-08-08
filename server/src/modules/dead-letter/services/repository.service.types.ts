export type FindAllOptions = {
  status?: string;
  queueName?: string;
  nextRetryAtBefore?: Date;
  nextRetryAtAfter?: Date;
  limit?: number;
  offset?: number;
  requestId?: string;
  search?: string;
};
