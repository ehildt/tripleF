/**
 * Replace every `apiKey` string in an overrides record with its encrypted
 * payload (AES-256-GCM, see SecretsCipherService). Empty values drop the
 * field; when the cipher declines (disabled), the apiKey is omitted so no
 * plaintext secret ever reaches the database.
 */
export function encryptOverridesSecrets(
  overrides: Record<string, Record<string, unknown>>,
  encrypt: (plaintext: string) => string | undefined,
): Record<string, Record<string, unknown>> {
  const result: Record<string, Record<string, unknown>> = {};
  for (const [provider, values] of Object.entries(overrides)) {
    const { apiKey, ...rest } = values;
    result[provider] = { ...rest };
    if (typeof apiKey === 'string' && apiKey) {
      const encrypted = encrypt(apiKey);
      if (encrypted) result[provider].apiKey = encrypted;
    }
  }
  return result;
}
