import type { D3ChartMarker } from '../D3Chart.types';

/** Project a chart marker into the layout input shape. */
export function mapMarkerToLayout(
  marker: D3ChartMarker,
  resolveTokenColor: (token: string | undefined, alpha: number) => string,
) {
  return {
    time: marker.time,
    position: marker.position,
    color: resolveTokenColor(marker.color, 1),
    shape: marker.shape,
    text: marker.text,
  };
}
