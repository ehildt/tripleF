import type { ModuleMetadata, Provider } from '@nestjs/common';
import type { ConnectionOptions, DefaultJobOptions } from 'bullmq';

export type BullMQConfig = {
  defaultJobOptions?: DefaultJobOptions;
  connection?: ConnectionOptions;
};

export type QueueConfig = {
  name: string;
  connection?: ConnectionOptions;
};

export type BullMQConfigFactory = (...deps: any[]) => Promise<BullMQConfig> | BullMQConfig;

export type Queue = string | QueueConfig;

export type BullMQModuleProps = {
  imports?: ModuleMetadata['imports'];
  global?: boolean;
  inject: Array<any>;
  queues: Queue[];
  processors: Array<Provider>;
  useFactory: BullMQConfigFactory;
};
