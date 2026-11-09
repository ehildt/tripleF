import type { AssistantResponseData } from '@/types/assistant-response-data.model';
import type { LightboxImage } from '@/types/lightbox.model';

export interface AssistantResponseProps {
  /** Harness template identifier used to select the response renderer. */
  template: string;
  /** Structured response data before client-side part filtering. */
  data?: AssistantResponseData;
  /** Plain text used by the text renderer and fallback response. */
  text?: string;
  /** Chart data streamed from EODHD tools, keyed by tool name. */
  chartData?: Record<string, unknown>;
  /** Whether chart streaming has advanced far enough to reveal charts. */
  revealCharts?: boolean;
}

export interface AssistantResponseEmits {
  /** Open the aggregate response lightbox at the clicked image URL. */
  (event: 'imageClicked', images: LightboxImage[], clickedUrl: string): void;
}
