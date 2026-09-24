/**
 * Probe an ordered list of video poster candidates and return the first one
 * that actually exists (HTTP 200). YouTube serves a 404 status with a valid
 * 120x90 placeholder image body for missing maxresdefault thumbnails, so the
 * browser fires `load` (not `error`) and an @error-based fallback never
 * advances. Probing the HTTP status picks the best real thumbnail upfront.
 *
 * Results are cached per URL so repeated renders of the same video (gallery
 * rows, hero, playlist) don't re-probe.
 */

const availabilityCache = new Map<string, boolean>();

async function probeImageAvailability(url: string): Promise<boolean> {
  const cached = availabilityCache.get(url);
  if (cached !== undefined) return cached;
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const available = response.ok;
    availabilityCache.set(url, available);
    return available;
  } catch {
    availabilityCache.set(url, false);
    return false;
  }
}

export async function resolveBestVideoPosterUrl(
  candidates: string[],
): Promise<string | null> {
  for (const candidate of candidates) {
    if (await probeImageAvailability(candidate)) return candidate;
  }
  return null;
}

/** Test seam: drop cached availability so a fresh probe runs. */
export function clearVideoPosterProbeCache(): void {
  availabilityCache.clear();
}
