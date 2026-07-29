/**
 * Inverse of encryptOverridesSecrets: restore the plaintext `apiKey` fields
 * of a persisted overrides record. Fields that fail to decrypt (wrong or
 * removed master key, tampered data) are dropped — the env key applies
 * again and the user can re-enter the key in SysCtl.
 */
export function decryptOverridesSecrets(
  values: Record<string, Record<string, unknown>>,
  decrypt: (payload: string) => string | null,
): Record<string, Record<string, unknown>> {
  const result: Record<string, Record<string, unknown>> = {};
  for (const [provider, entry] of Object.entries(values)) {
    const { apiKey, ...rest } = entry;
    result[provider] = { ...rest };
    if (typeof apiKey === 'string' && apiKey) {
      const decrypted = decrypt(apiKey);
      if (decrypted) result[provider].apiKey = decrypted;
    }
  }
  return result;
}
