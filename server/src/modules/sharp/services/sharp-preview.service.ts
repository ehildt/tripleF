import { Inject, Injectable } from '@nestjs/common';

import type { FastifyMultipartMeta } from '../../harness/dtos/harness-job.dto.js';

import { SharpService } from './sharp.service.js';
import { SharpOverridesService } from './sharp-overrides.service.js';

/** One preprocessing variant of the preview upload, encoded for display. */
export interface SharpPreviewVariant {
  variant: string;
  name: string;
  description: string;
  dataUrl: string;
}

/**
 * Preprocessing preview: runs an uploaded image through the same sharp
 * pipeline harness jobs use, against the current effective config, and
 * returns the resulting variants as data URLs so the dashboard can show
 * exactly what the model will receive.
 */
@Injectable()
export class SharpPreviewService {
  constructor(
    @Inject(SharpService)
    private readonly sharpService: SharpService,
    @Inject(SharpOverridesService)
    private readonly sharpOverrides: SharpOverridesService,
  ) {}

  async preview(
    buffer: Buffer,
    meta: FastifyMultipartMeta,
  ): Promise<SharpPreviewVariant[]> {
    // The full effective config — including enabled: false, which
    // buildOptions() would collapse into the env defaults instead.
    const config = this.sharpOverrides.getConfig();
    const processed = await this.sharpService.preprocessImages(
      [buffer],
      [meta],
      {
        enabled: config.enabled,
        resize: config.resize,
        variants: config.variants,
        parameters: config.parameters,
      },
    );

    return processed.map((image) => ({
      variant: image.variant,
      name: image.meta.name,
      description: image.description,
      dataUrl: `data:${image.meta.type};base64,${image.buffer.toString('base64')}`,
    }));
  }
}
