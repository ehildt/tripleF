/**
 * Compute a SHA-256 hex hash for a browser File. Prefers the native
 * WebCrypto API and falls back to a pure-JS sha256 on insecure origins
 * (crypto.subtle is unavailable on plain http, e.g. LAN or container hosts).
 * Both paths produce the standard SHA-256 hex digest, so hashes agree with
 * the server's hashPayload.
 */
export async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  if (globalThis.crypto?.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  const { sha256 } = await import('js-sha256');
  return sha256(new Uint8Array(buffer));
}
