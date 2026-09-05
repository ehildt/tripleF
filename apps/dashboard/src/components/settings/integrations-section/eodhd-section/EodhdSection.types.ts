import type { EodhdConfig } from '../../settings-config.model';

export interface EodhdSectionProps {
  config: EodhdConfig;
  updateApiKey: (apiKey: string) => Promise<boolean>;
}
