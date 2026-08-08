import type { TabPanelTab } from '../../../shared/ui/tab-panel/TabPanel.types';

export type DetailTabId =
  'error' | 'params' | 'headers' | 'prompt' | 'body' | 'response';

export interface DetailTab extends TabPanelTab {
  id: DetailTabId;
  content: unknown;
}

export interface ParsedEndpoint {
  path: string;
  event: string;
  room?: string;
  params: Array<{ key: string; value: string }>;
}
