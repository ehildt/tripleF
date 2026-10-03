import type {
  ProviderOverrides,
  ProviderSessionOverrides,
} from './provider-overrides.types';

export interface MirroredOverrides {
  /** Snapshot copy with the endpoint merged under provider → source. */
  snapshot: ProviderOverrides;
  /** Session overrides copy with the endpoint merged under provider → source. */
  session: ProviderSessionOverrides;
}
