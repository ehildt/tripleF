import { harnessDataToPromptText } from '@/stores/helpers/messages/harness-data-to-prompt-text.helper';
import type { HarnessResponseData } from '@/types/harness-response-data.model';

import { articleToText } from '../../../templates/article-response/helpers/article-to-text.helper';
import { compareToText } from '../../../templates/compare-response/helpers/compare-to-text.helper';
import { describeToText } from '../../../templates/describe-response/helpers/describe-to-text.helper';
import { evaluationToText } from '../../../templates/evaluation-response/helpers/evaluation-to-text.helper';
import { imagelistToText } from '../../../templates/imagelist-response/helpers/imagelist-to-text.helper';
import { newsToText } from '../../../templates/news-response/helpers/news-to-text.helper';
import { ocrToText } from '../../../templates/ocr-response/helpers/ocr-to-text.helper';
import { productToText } from '../../../templates/product-response/helpers/product-to-text.helper';
import { summaryToText } from '../../../templates/summary-response/helpers/summary-to-text.helper';
import { videolistToText } from '../../../templates/videolist-response/helpers/videolist-to-text.helper';

const transformers: Record<string, (data: HarnessResponseData) => string> = {
  article: articleToText,
  compare: compareToText,
  describe: describeToText,
  evaluation: evaluationToText,
  imagelist: imagelistToText,
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
