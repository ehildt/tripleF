import { articleToText } from '@/stores/helpers/assistant-response/to-text/article-to-text.helper';
import { compareToText } from '@/stores/helpers/assistant-response/to-text/compare-to-text.helper';
import { describeToText } from '@/stores/helpers/assistant-response/to-text/describe-to-text.helper';
import { evaluationToText } from '@/stores/helpers/assistant-response/to-text/evaluation-to-text.helper';
import { imagelistToText } from '@/stores/helpers/assistant-response/to-text/imagelist-to-text.helper';
import { mergeToText } from '@/stores/helpers/assistant-response/to-text/merge-to-text.helper';
import { newsToText } from '@/stores/helpers/assistant-response/to-text/news-to-text.helper';
import { ocrToText } from '@/stores/helpers/assistant-response/to-text/ocr-to-text.helper';
import { productToText } from '@/stores/helpers/assistant-response/to-text/product-to-text.helper';
import { summaryToText } from '@/stores/helpers/assistant-response/to-text/summary-to-text.helper';
import { videolistToText } from '@/stores/helpers/assistant-response/to-text/videolist-to-text.helper';
import { responseDataToPromptText } from '@/stores/messages/helpers/response-data-to-prompt-text.helper';
import type { AssistantResponseData } from '@/types/assistant-response-data.model';

const transformers: Record<string, (data: AssistantResponseData) => string> = {
  article: articleToText,
  compare: compareToText,
  describe: describeToText,
  evaluation: evaluationToText,
  imagelist: imagelistToText,
  merge: mergeToText,
  news: newsToText,
  ocr: ocrToText,
  product: productToText,
  summary: summaryToText,
  videolist: videolistToText,
};

/**
 * Convert a structured assistant response into plain text for the model
 * history, using the transform owned by the template that produced it.
 * Unknown or legacy templates fall back to the generic flattener.
 */
export function assistantResponseToText(
  template: string | undefined,
  data: AssistantResponseData,
): string {
  const transform = (template && transformers[template]) || null;
  return transform ? transform(data) : responseDataToPromptText(data);
}
