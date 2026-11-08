import { buildVideoPosterCandidates } from './build-video-poster-candidates.helper';

/**
 * Derive the best-quality poster image URL for a video page URL. Returns the
 * highest-resolution candidate (null when none exists); callers that need a
 * graceful degradation should use `buildVideoPosterCandidates` and fall back
 * on image error.
 */
export function buildVideoPosterUrl(videoUrl: string): string | null {
  return buildVideoPosterCandidates(videoUrl)[0] ?? null;
}
