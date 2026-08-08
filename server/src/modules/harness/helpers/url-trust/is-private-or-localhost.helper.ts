/**
 * Returns true for hostnames that resolve to loopback, link-local, or
 * private network addresses. Used to reject URLs that would make the
 * server probe internal infrastructure (SSRF) or that are unreachable
 * from the dashboard.
 */
export function isPrivateOrLocalhost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (lower === 'localhost' || lower.endsWith('.localhost')) return true;
  if (lower === '127.0.0.1' || lower === '0.0.0.0') return true;
  if (lower.startsWith('10.')) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(lower)) return true;
  if (lower.startsWith('192.168.')) return true;
  if (lower.startsWith('169.254.')) return true;
  return false;
}
