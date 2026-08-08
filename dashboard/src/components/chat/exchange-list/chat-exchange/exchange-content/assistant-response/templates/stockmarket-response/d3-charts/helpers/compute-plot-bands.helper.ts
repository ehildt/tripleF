/** A horizontal slice of the plot area in pixels. */
export interface PlotBand {
  top: number;
  bottom: number;
}

export interface PlotBands {
  /** Band the price scale spans. */
  price: PlotBand;
  /** Band the volume scale spans when the histogram volume style is active. */
  volume: PlotBand | null;
}

/**
 * How the plot height is split between the price and volume scales. With the
 * histogram volume style the price keeps the top ~60% and volume the bottom
 * ~30% (mirroring the lightweight-charts scale margins); otherwise the price
 * fills the plot with small padding so the axes breathe.
 */
export function computePlotBands(
  plotTop: number,
  plotBottom: number,
  splitVolume: boolean,
): PlotBands {
  const height = plotBottom - plotTop;
  if (!splitVolume) {
    return {
      price: {
        top: plotTop + height * 0.06,
        bottom: plotBottom - height * 0.03,
      },
      volume: null,
    };
  }
  return {
    price: { top: plotTop + height * 0.1, bottom: plotTop + height * 0.6 },
    volume: { top: plotTop + height * 0.7, bottom: plotBottom },
  };
}
