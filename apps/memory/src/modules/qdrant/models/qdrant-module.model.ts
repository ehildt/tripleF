import type { ModuleMetadata } from '@nestjs/common';

import type { QdrantConfig } from './qdrant-config.model.js';

type QdrantConfigFactory = (
  ...deps: any[]
) => Promise<QdrantConfig> | QdrantConfig;

export type QdrantModuleProps = {
  imports?: ModuleMetadata['imports'];
  global?: boolean;
  inject: Array<any>;
  useFactory: QdrantConfigFactory;
};
