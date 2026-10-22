import { Injectable } from '@nestjs/common';

import { EodhdClient } from '../../stock-data/providers/eodhd/eodhd-client.js';
import { EODHD_ENDPOINT_KEYS } from '../constants/provider-overrides.constants.js';

import { toEodhdCapabilities } from './helpers/to-eodhd-capabilities.helper.js';
import { CapabilityDiscoveryService } from './capability-discovery.service.js';
import type { EodhdCapabilities } from './eodhd-discovery.service.types.js';

/**
 * EODHD capability lane: discovers which endpoints a key can reach by
 * querying the User API (/internal-user) once. A call costs 1 API call, so
 * the cache TTL and refresh guards live in the base capability-discovery
 * service.
 */
@Injectable()
export class EodhdDiscoveryService extends CapabilityDiscoveryService<EodhdCapabilities> {
  protected async fetchCapabilities(key: string): Promise<EodhdCapabilities> {
    const info = await new EodhdClient(key).getUserInfo();
    const capabilities = toEodhdCapabilities(info);
    this.logger.log(
      `EODHD capabilities discovered (${capabilities.plan ?? 'unknown plan'}): ` +
        EODHD_ENDPOINT_KEYS.map(
          (k) => `${k}:${capabilities.endpoints[k] ? 'on' : 'off'}`,
        ).join(' '),
    );
    return capabilities;
  }
}
