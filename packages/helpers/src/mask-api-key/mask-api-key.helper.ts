/**
 * Mask an API key for client display as a fixed run of asterisks
 * (****************) — nothing about the real key (not even its length or
 * prefix) is exposed. The masked form must never be accepted back as a
 * real key — updateConfig rejects values containing the mask.
 */
export function maskApiKey(apiKey?: string): string | undefined {
  if (!apiKey) return apiKey;
  return '****************';
}
