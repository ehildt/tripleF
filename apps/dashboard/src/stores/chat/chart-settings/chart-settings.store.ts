import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

import {
  CHART_CONFIG_KEY,
  DEFAULT_CHART_CONFIG,
} from './chart-settings.constant';
import type { ChartConfig } from './chart-settings.model';

function loadChartConfig(): ChartConfig {
  try {
    const saved = JSON.parse(localStorage.getItem(CHART_CONFIG_KEY) || '{}');
    return { ...DEFAULT_CHART_CONFIG, ...saved };
  } catch {
    return { ...DEFAULT_CHART_CONFIG };
  }
}

function saveChartConfig(value: ChartConfig): void {
  try {
    localStorage.setItem(CHART_CONFIG_KEY, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export const useChartSettingsStore = defineStore('chart-settings', () => {
  /** Global defaults every stock chart inherits unless overridden per chart. */
  const chartConfig = ref<ChartConfig>(loadChartConfig());

  watch(chartConfig, saveChartConfig, { deep: true });

  function setChartConfig(patch: Partial<ChartConfig>): void {
    chartConfig.value = { ...chartConfig.value, ...patch };
  }

  return { chartConfig, setChartConfig };
});
