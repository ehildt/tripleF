<script lang="ts">
/**
 * DOM renderer for the curated taxonomy icon set: renders a Lucide icon by
 * its allowlist kebab name as an inline SVG (stroke style matches Lucide:
 * outline, round caps). Used by the taxonomy manager and the icon picker —
 * the constellation canvas has its own Path2D pipeline (canvas, not DOM).
 */
import { defineComponent, h } from 'vue';

import { TAXONOMY_ICON_NODES } from '@/components/memory/memory-constellation/helpers/taxonomy-icon-nodes.helper';

/** Tags the tuple renderer knows (Lucide's full element set). */
const SVG_TAGS = new Set([
  'path',
  'circle',
  'ellipse',
  'rect',
  'line',
  'polygon',
  'polyline',
]);

export default defineComponent({
  name: 'TaxonomyIcon',
  props: {
    /** Kebab-case Lucide name from the curated taxonomy allowlist. */
    name: { type: String, default: undefined },
    /** Square size in px (default 16). */
    size: { type: Number, default: 16 },
  },
  setup(props) {
    return () => {
      const tuples = props.name ? TAXONOMY_ICON_NODES[props.name] : undefined;
      if (!tuples) return null;
      return h(
        'svg',
        {
          xmlns: 'http://www.w3.org/2000/svg',
          width: props.size,
          height: props.size,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': 2,
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          'aria-hidden': 'true',
          class: ['taxonomy-icon', `taxonomy-icon--${props.name}`],
        },
        tuples
          .filter(([tag]) => SVG_TAGS.has(tag))
          .map(([tag, attrs], index) => {
            const { key, ...rest } = attrs;
            return h(tag, { ...rest, key: String(key ?? index) });
          }),
      );
    };
  },
});
</script>
