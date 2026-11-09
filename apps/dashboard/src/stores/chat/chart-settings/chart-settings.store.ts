import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

import { parseChartConfig } from './helpers/parse-chart-config.helper';
import {
  CHART_CONFIG_KEY,
  DEFAULT_CHART_CONFIG,
} from './chart-settings.constant';
import type { ChartConfig } from './chart-settings.model';

export const useChartSettingsStore = defineStore('chart-settings', () => {
  /** Global defaults every stock chart inherits unless overridden per chart. */
  const chartConfig = ref<ChartConfig>({ ...DEFAULT_CHART_CONFIG });
  try {
    chartConfig.value = parseChartConfig(
      localStorage.getItem(CHART_CONFIG_KEY),
    );
  } catch {
    /* Storage unavailable: retain the chart defaults. */
  }

  watch(
    chartConfig,
    (value) => {
      try {
        localStorage.setItem(CHART_CONFIG_KEY, JSON.stringify(value));
      } catch {
        /* Storage unavailable: retain the preference in memory. */
      }
    },
    { deep: true },
  );

  function setChartConfig(patch: Partial<ChartConfig>): void {
    chartConfig.value = { ...chartConfig.value, ...patch };
  }

  return { chartConfig, setChartConfig };
});
