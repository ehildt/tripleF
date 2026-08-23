import { symbol, symbolCircle, symbolSquare, symbolTriangle } from 'd3-shape';

import type { MarkerSymbol } from './build-marker-layout.helper';

const triangleSymbol = symbol().type(symbolTriangle).size(64);
// The circle is the range-extreme bullet (HIGH/LOW markers): a touch larger
// than the arrows so the dot reads clearly on the dashed level line.
const circleSymbol = symbol().type(symbolCircle).size(100);
const squareSymbol = symbol().type(symbolSquare).size(64);

/** The SVG path for a marker symbol (triangle is the default/arrow). */
export function resolveMarkerSymbolPath(symbolName: MarkerSymbol): string {
  if (symbolName === 'circle') return circleSymbol() ?? '';
  if (symbolName === 'square') return squareSymbol() ?? '';
  return triangleSymbol() ?? '';
}
