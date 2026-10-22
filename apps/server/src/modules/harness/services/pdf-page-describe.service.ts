import { Injectable, Logger } from '@nestjs/common';
import { buildDescribePdfPagePrompt } from '@triplef/agent/prompts';
import { AiSdkService } from '@triplef/ai-sdk';

import { buildProviderOptions } from '../../ollama/helpers/provider-options.helper.js';

import type { DescribePdfPagesInput } from './pdf-page-describe.service.types.js';

/**
 * Describes pdf pages with a vision model — one page per call, strictly
 * sequential (parallel calls would choke a local Ollama). One round, no
 * retries: a failure propagates so the caller persists nothing and the pages
 * are described on the next turn instead. Thinking is off — this is
 * extraction/transcription, not reasoning.
 */
@Injectable()
export class PdfPageDescribeService {
  private readonly logger = new Logger(PdfPageDescribeService.name);

  constructor(private readonly aiSdkService: AiSdkService) {}

  /** pageNumber → description text ('' when the model reported an empty page). */
  async describePages(
    input: DescribePdfPagesInput,
  ): Promise<Map<number, string>> {
    const descriptions = new Map<number, string>();
    for (const page of input.pages) {
      const { text } = await this.aiSdkService.generateChat({
        model: input.model,
        messages: [
          {
            role: 'user',
            content: buildDescribePdfPagePrompt(
              input.documentName,
              page.pageNumber,
              input.pageCount,
            ),
            images: [new Uint8Array(page.buffer)],
          },
        ],
        providerOptions: buildProviderOptions({ think: false }),
        abortSignal: input.abortSignal,
      });
      this.logger.log(
        {
          document: input.documentName,
          page: page.pageNumber,
          chars: text?.length ?? 0,
        },
        'pdf page described',
      );
      descriptions.set(page.pageNumber, text?.trim() ?? '');
    }
    return descriptions;
  }
}
