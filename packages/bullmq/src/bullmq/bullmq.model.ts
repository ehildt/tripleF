import type { ModuleMetadata, Provider } from '@nestjs/common';
import type { DefaultJobOptions } from 'bullmq';
import type { RedisOptions } from 'ioredis';

export type BullMQConfig = {
  defaultJobOptions?: DefaultJobOptions;
  connection?: RedisOptions;
};

export type QueueConfig = {
  name: string;
  connection?: RedisOptions;
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
