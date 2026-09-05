import { DynamicModule, Module } from '@nestjs/common';

import type { PdfOptions } from './pdf.model.ts';
import { PdfService } from './pdf.service.ts';

/**
 * Registers PdfService (pdfjs text extraction + page rendering). Static
 * module, no injectable config — `registerAsync()` only controls the global
 * scope flag, mirroring the other @triplef packages.
 */
@Module({})
export class PdfModule {
  static registerAsync(options?: PdfOptions): DynamicModule {
    return {
      global: options?.global,
      module: PdfModule,
      exports: [PdfService],
      providers: [PdfService],
    };
  }
}
