import { Injectable } from '@nestjs/common';
import { SocketIOService } from '@triplef/socketio';

import { buildSocketEvent } from '../../socket-io/helpers/build-socket-event.helper.js';

/** Topic the dashboard listens to for "the DLQ changed" activity. */
const DLQ_CHANGED_TOPIC = 'dlq:changed';

/**
 * Broadcasts DLQ mutation signals on the socket bus. The payload carries no
 * domain data — the dashboard only needs to know that the DLQ changed since
 * it last looked; it re-reads the list when the user opens the tab.
 */
@Injectable()
export class DlqEventsService {
  constructor(private readonly socketIOService: SocketIOService) {}

  broadcastDlqChanged(): void {
    this.socketIOService.emit(
      DLQ_CHANGED_TOPIC,
      buildSocketEvent(DLQ_CHANGED_TOPIC, {}),
    );
  }
}
