import { IsIn } from 'class-validator';

/** The provider ids accepted by the provider-overrides routes. */
const PROVIDER_KEYS = [
  'serper',
  'brightData',
  'eodhd',
  'youtube',
  'sources',
] as const;

/** Path params for the provider-overrides routes (`:provider`). */
export class ProviderParamsDto {
  @IsIn(PROVIDER_KEYS)
  provider!: (typeof PROVIDER_KEYS)[number];
}
