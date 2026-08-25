export type AppConfig = {
  port: number;
  nodeEnv: string;
  address: string;
  printConfig: boolean;
  bodyLimit: number;
  enableSwagger: boolean;
  cors?: {
    origin?: string;
    methods?: string;
    preflightContinue?: boolean;
    optionsSuccessStatus?: number;
    credentials?: boolean;
    allowedHeaders?: string;
  };
  health?: {
    memoryHeap?: number;
    memoryRSS?: number;
    diskPath?: string;
    diskThresholdPercent?: number;
  };
};
