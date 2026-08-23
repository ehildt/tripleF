import { computeAdx } from './compute-adx.helper.js';
import { computeAtr } from './compute-atr.helper.js';
import { computeBollingerBands } from './compute-bbands.helper.js';
import { computeEma } from './compute-ema.helper.js';
import { computeMacd } from './compute-macd.helper.js';
import { computeRsi } from './compute-rsi.helper.js';
import { computeSma } from './compute-sma.helper.js';
import { computeStochastic } from './compute-stochastic.helper.js';
import type { IndicatorSeries, OhlcBar } from './indicators.types.js';

export type TechnicalFunction =
  'rsi' | 'macd' | 'adx' | 'sma' | 'ema' | 'bbands' | 'atr' | 'stochastic';

/** Primary chart series plus the latest values of every auxiliary line. */
interface ComputedIndicator {
  points: Array<{ time: string; value: number }>;
  summary: Record<string, number | undefined>;
}

/** Latest non-null value of an aligned series. */
function latestOf(series: IndicatorSeries): number | undefined {
  for (let i = series.length - 1; i >= 0; i--) {
    if (series[i] !== null) return series[i]!;
  }
  return undefined;
}

function toPoints(
  bars: OhlcBar[],
  series: IndicatorSeries,
): Array<{ time: string; value: number }> {
  const points: Array<{ time: string; value: number }> = [];
  for (let i = 0; i < bars.length; i++) {
    if (series[i] !== null)
      points.push({ time: bars[i].time, value: series[i]! });
  }
  return points;
}

function single(
  bars: OhlcBar[],
  series: IndicatorSeries,
  latestKey: string,
): ComputedIndicator {
  return {
    points: toPoints(bars, series),
    summary: { [latestKey]: latestOf(series) },
  };
}

/**
 * Compute a technical indicator over daily bars cached in Postgres. Primary
 * series selection per function mirrors what the charts draw: rsi/atr/adx and
 * the moving averages map one-to-one; macd yields the macd line (summary adds
 * signal + histogram), bbands the middle band (summary adds the bands), and
 * stochastic the %K line (summary adds %D).
 */
export function computeIndicator(
  bars: OhlcBar[],
  fn: TechnicalFunction,
  period?: number,
): ComputedIndicator {
  const closes = bars.map((b) => b.close);
  switch (fn) {
    case 'sma':
      return single(bars, computeSma(closes, period ?? 50), 'latestValue');
    case 'ema':
      return single(bars, computeEma(closes, period ?? 50), 'latestValue');
    case 'rsi':
      return single(bars, computeRsi(closes, period ?? 14), 'latestValue');
    case 'atr':
      return single(bars, computeAtr(bars, period ?? 14), 'latestValue');
    case 'macd': {
      const r = computeMacd(closes);
      return {
        points: toPoints(bars, r.macd),
        summary: {
          latestValue: latestOf(r.macd),
          latestSignal: latestOf(r.signal),
          latestHistogram: latestOf(r.histogram),
        },
      };
    }
    case 'bbands': {
      const r = computeBollingerBands(closes, period ?? 20);
      return {
        points: toPoints(bars, r.middle),
        summary: {
          latestValue: latestOf(r.middle),
          latestUpper: latestOf(r.upper),
          latestLower: latestOf(r.lower),
        },
      };
    }
    case 'adx': {
      const r = computeAdx(bars, period ?? 14);
      return {
        points: toPoints(bars, r.adx),
        summary: {
          latestValue: latestOf(r.adx),
          latestPlusDi: latestOf(r.plusDi),
          latestMinusDi: latestOf(r.minusDi),
        },
      };
    }
    case 'stochastic': {
      const r = computeStochastic(bars, period ?? 14);
      return {
        points: toPoints(bars, r.k),
        summary: { latestValue: latestOf(r.k), latestD: latestOf(r.d) },
      };
    }
  }
}
