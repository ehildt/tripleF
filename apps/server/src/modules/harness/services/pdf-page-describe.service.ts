import { Injectable, Logger } from '@nestjs/common';
import { buildDescribePdfPagePrompt } from '@triplef/agent/prompts';
import { AiSdkService } from '@triplef/ai-sdk';

import { buildProviderOptions } from '../../ollama/helpers/provider-options.helper.js';

interface DescribePdfPagesInput {
  /** Chat model to describe with (callers gate on vision capability). */
  model: string;
  /** Original filename — the prompt references the document it belongs to. */
  documentName: string;
  /** Total page count of the document (prompt context). */
  pageCount: number;
  /** Pages to describe: encoded page images with their 1-based page number. */
  pages: Array<{ buffer: Buffer; pageNumber: number }>;
  abortSignal?: AbortSignal;
}

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
