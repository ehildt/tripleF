import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';

import { SearXNGConfigService } from '../../../configs/searxng-config.service.js';

@Injectable()
export class SearXNGHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly searxngConfigService: SearXNGConfigService,
  ) {}

  async check(key: string) {
    const indicator = this.healthIndicatorService.check(key);
    try {
      const url = this.searxngConfigService.config.url;
      if (!url) return indicator.up();

      const res = await fetch(`${url}/search?q=health&format=json`, {
        headers: { 'X-Forwarded-For': '127.0.0.1' },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return indicator.up();
    } catch (error) {
      return indicator.down({ message: String(error) });
    }
  }
}
