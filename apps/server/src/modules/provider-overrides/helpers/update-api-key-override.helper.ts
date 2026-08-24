import { isMaskedApiKey } from '@triplef/helpers/mask-api-key';

/**
 * API key patch rules: a masked-looking value is ignored (it is the display
 * form, not a key); an empty value clears the override so the env key applies
 * again; anything else becomes the new override. Mutates the provider's
 * override record in place.
 */
export function updateApiKeyOverride(
  overrides: Record<string, any>,
  provider: string,
  value: unknown,
): void {
  if (isMaskedApiKey(value)) return;
  if (typeof value === 'string' && value.trim() === '') {
    delete overrides[provider].apiKey;
    return;
  }
  if (typeof value === 'string') {
    overrides[provider].apiKey = value.trim();
  }
}
