import { computed, type MaybeRefOrGetter, ref, toValue, watch } from 'vue';

import { buildVideoPosterCandidates } from '../../../composables/helpers/media/build-video-poster-url.helper';
import { resolveBestVideoPosterUrl } from '../../../composables/helpers/media/resolve-best-video-poster-url.helper';

/**
 * Resolve a video poster image with a graceful quality fallback. The primary
 * poster is the highest-resolution candidate (e.g. YouTube maxresdefault);
 * when it fails to load, the src advances down the candidate chain
 * (hqdefault → mqdefault) so a missing high-res never leaves a broken image.
 *
 * YouTube serves a 404 status with a valid 120x90 placeholder body for
 * missing maxresdefault thumbnails, so the browser fires `load` (not `error`)
 * and an @error-only fallback never advances. We therefore probe the built
 * candidate chain (HEAD) and jump to the best resolution that actually
 * exists, keeping @error as a safety net for genuinely broken images.
 *
 * The fallback chain only applies when the poster is the URL we built
 * ourselves; a search-provided thumbnailUrl is used as-is.
 */
export function useVideoPosterFallback(
  posterUrl: MaybeRefOrGetter<string | null | undefined>,
  videoUrl: MaybeRefOrGetter<string>,
) {
  const candidates = computed(() => {
    const primary = toValue(posterUrl);
    if (!primary) return [];
    const built = buildVideoPosterCandidates(toValue(videoUrl));
    return built.length > 0 && built[0] === primary ? built : [primary];
  });

  const currentIndex = ref(0);
  const currentSrc = computed(
    () => candidates.value[currentIndex.value] ?? null,
  );

  // Reset to the best candidate whenever the poster URL changes. flush:'sync'
  // so the src is already reset when the caller reads it in the same tick.
  watch(
    () => candidates.value[0],
    () => {
      currentIndex.value = 0;
    },
    { flush: 'sync' },
  );

  // Probe the built candidate chain and jump to the best resolution that
  // actually exists. Ignore stale results if the poster changed mid-probe.
  watch(
    () => candidates.value,
    async (list) => {
      if (list.length <= 1) return;
      const best = await resolveBestVideoPosterUrl(list);
      if (candidates.value !== list) return;
      if (best) {
        const index = list.indexOf(best);
        if (index >= 0) currentIndex.value = index;
      }
    },
    { immediate: true },
  );

  function onPosterError() {
    if (currentIndex.value < candidates.value.length - 1) {
      currentIndex.value += 1;
    }
  }

  return { currentSrc, onPosterError };
}
