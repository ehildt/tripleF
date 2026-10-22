import { ref } from 'vue';

/**
 * The tab menu's live viewport rect (left edge and width), shared across
 * the app so other floating chrome — the playlist window — can position
 * itself beside the menu. **Singleton: the state lives at module scope**
 * because the tab menu mounts exactly once at app level; give specs a
 * reset step between tests.
 *
 * The rect is *reported data*, never read off the DOM by a consumer: the
 * tab menu measures its own element (its composable owns the observers) and
 * reports through this composable — CSS-class lookups across component
 * boundaries are styling-hook sniffing, not a data channel.
 */
const tabMenuRect = ref({ left: 0, width: 0 });

export function useTabMenuRect() {
  /**
   * Publish the menu's current rect; ({left: 0, width: 0}) means "no
   * measured menu" — consumers treat width 0 as unpositioned.
   */
  function reportTabMenuRect(next: { left: number; width: number }) {
    tabMenuRect.value = next;
  }

  return { tabMenuRect, reportTabMenuRect };
}
