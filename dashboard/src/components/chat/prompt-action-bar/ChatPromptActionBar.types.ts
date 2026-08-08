import type { SetDropdownRef } from '../composables/use-chat-dropdowns.types';
import type { SearchEngineState } from '../composables/use-search-engine-availability.types';

export interface ChatPromptActionBarProps {
  value: string;
  thinkOptions: readonly string[];
  thinkValue: string;
  contextSizeOptions: readonly string[];
  contextSizeValue: string;
  defaultContextSize: string;
  formatContextSize: (value: string) => string;
  isDisabled: boolean;
  isFileSelectDisabled: boolean;
  fileSelectDisabledReason?: string;
  searchEngineState?: SearchEngineState;
  /** Every toggleable search source (web, images, news, …) + its state. */
  searchSources?: { key: string; enabled: boolean }[];
  /** EODHD stock-market engine state: available + enabled. */
  eodhdState?: { available: boolean; enabled: boolean };
  setActionBarRef: SetDropdownRef;
  setThinkDropdownRef: SetDropdownRef;
  setContextSizeDropdownRef: SetDropdownRef;
}
