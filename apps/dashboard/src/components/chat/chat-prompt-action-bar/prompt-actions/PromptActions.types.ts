import type { SetDropdownRef } from '../../shared/composables/use-chat-dropdowns.types';
import type { SearchEngineState } from '../../shared/composables/use-search-engine-availability.types';

export interface PromptActionsProps {
  /** Class object for the actions row (grid layout + indicator column). */
  actionsClass: Record<string, boolean>;
  thinkOptions: readonly string[];
  thinkValue: string;
  contextSizeOptions: readonly string[];
  contextSizeValue: string;
  defaultContextSize: string;
  formatContextSize: (value: string) => string;
  isDisabled: boolean;
  fileSelectTitle: string;
  isFileSelectDisabled: boolean;
  searchEngineState?: SearchEngineState;
  /** Tooltip for the globe search-engine kill switch. */
  searchEngineToggleTitle: string;
  /** Tooltip for the offline globe indicator. */
  noSearchEngineTitle: string;
  setThinkDropdownRef: SetDropdownRef;
  setContextSizeDropdownRef: SetDropdownRef;
}
