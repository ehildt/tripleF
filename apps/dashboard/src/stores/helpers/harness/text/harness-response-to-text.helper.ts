import { articleToText } from '@/stores/helpers/harness/to-text/article-to-text.helper';
import { compareToText } from '@/stores/helpers/harness/to-text/compare-to-text.helper';
import { describeToText } from '@/stores/helpers/harness/to-text/describe-to-text.helper';
import { evaluationToText } from '@/stores/helpers/harness/to-text/evaluation-to-text.helper';
import { imagelistToText } from '@/stores/helpers/harness/to-text/imagelist-to-text.helper';
import { mergeToText } from '@/stores/helpers/harness/to-text/merge-to-text.helper';
import { newsToText } from '@/stores/helpers/harness/to-text/news-to-text.helper';
import { ocrToText } from '@/stores/helpers/harness/to-text/ocr-to-text.helper';
import { productToText } from '@/stores/helpers/harness/to-text/product-to-text.helper';
import { summaryToText } from '@/stores/helpers/harness/to-text/summary-to-text.helper';
import { videolistToText } from '@/stores/helpers/harness/to-text/videolist-to-text.helper';
import { harnessDataToPromptText } from '@/stores/helpers/messages/harness-data-to-prompt-text.helper';
import type { HarnessResponseData } from '@/types/harness-response-data.model';

const transformers: Record<string, (data: HarnessResponseData) => string> = {
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
export function harnessResponseToText(
  template: string | undefined,
  data: HarnessResponseData,
): string {
  const transform = (template && transformers[template]) || null;
  return transform ? transform(data) : harnessDataToPromptText(data);
}
