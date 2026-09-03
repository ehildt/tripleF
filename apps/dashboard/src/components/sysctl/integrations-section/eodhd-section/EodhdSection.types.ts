import type { EodhdConfig } from '../../sysctl-config.model';

export interface EodhdSectionProps {
  config: EodhdConfig;
  updateApiKey: (apiKey: string) => Promise<boolean>;
}
