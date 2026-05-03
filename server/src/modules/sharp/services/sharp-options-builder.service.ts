import { Injectable } from '@nestjs/common';

import { HarnessStreamQueryDto } from '../../harness/dtos/harness-stream-query.dto.js';
import { SharpConfigService } from '../configs/sharp-config.service.js';
import { SharpOptions } from '../dtos/sharp-options.dto.js';
import { buildSharpOptions } from '../helpers/sharp-options.helper.js';

@Injectable()
export class SharpOptionsBuilder {
  constructor(private readonly configService: SharpConfigService) {}

  /**
   * Build preprocessing options from flat query parameters.
   * Query values override env-backed defaults. Returns undefined when disabled.
   */
  build(query: HarnessStreamQueryDto): SharpOptions | undefined {
    return buildSharpOptions(query, this.configService.defaults);
  }
}
