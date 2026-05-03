import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class HarnessCancellationService {
  private readonly logger = new Logger(HarnessCancellationService.name);
  private readonly controllers = new Map<string, AbortController>();
  private readonly listeners = new Map<string, () => void>();

  register(requestId: string): AbortController {
    this.deregister(requestId, { quiet: true });

    const controller = new AbortController();
    this.controllers.set(requestId, controller);

    const listener = () => {
      if (controller.signal.reason === 'deregister-quiet') return;

      this.logger.log(`[HARNESS] request ${requestId} aborted`, {
        requestId,
        reason: controller.signal.reason,
      });
    };
    this.listeners.set(requestId, listener);
    controller.signal.addEventListener('abort', listener);

    return controller;
  }

  deregister(requestId: string, options: { quiet?: boolean } = {}): void {
    const listener = this.listeners.get(requestId);
    if (listener) {
      const controller = this.controllers.get(requestId);
      controller?.signal.removeEventListener('abort', listener);
      this.listeners.delete(requestId);
    }

    const existing = this.controllers.get(requestId);
    if (existing && !existing.signal.aborted) {
      existing.abort(
        options.quiet
          ? ('deregister-quiet' as const)
          : new Error(`Request ${requestId} deregistered`),
      );
    }
    this.controllers.delete(requestId);
  }

  cancel(requestId: string, reason = 'user-cancelled'): boolean {
    const controller = this.controllers.get(requestId);
    if (!controller || controller.signal.aborted) {
      return false;
    }

    controller.abort(new Error(reason));
    return true;
  }

  isActive(requestId: string): boolean {
    const controller = this.controllers.get(requestId);
    return controller !== undefined && !controller.signal.aborted;
  }
}
