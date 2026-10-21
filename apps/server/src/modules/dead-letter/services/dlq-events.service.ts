import { Injectable } from '@nestjs/common';
import { SocketIOService } from '@triplef/socketio';

import type { DeadLetterJob } from '../../../generated/prisma/client.js';
import { buildSocketEvent } from '../../socket-io/helpers/build-socket-event.helper.js';
import { serializeDlqEntry } from '../helpers/serialize-dlq-entry.helper.js';

/** Topic carrying a created/updated DLQ row (payload: the serialized entry). */
const DLQ_ENTRY_UPSERTED_TOPIC = 'dlq:entry-upserted';
/** Topic carrying the ids of rows the retention sweep actually erased. */
const DLQ_ENTRIES_REMOVED_TOPIC = 'dlq:entries-removed';
/** Topic for bulk mutations (cleanup status moves, batch reinstate) — no payload. */
const DLQ_BULK_CHANGED_TOPIC = 'dlq:bulk-changed';

/**
 * Broadcasts DLQ mutations on the socket bus so connected dashboards update
 * live instead of polling. Every connected client receives each broadcast;
 * the dashboard lights the activity dot on any of the three topics and
 * applies the carried data to its local store.
 */
@Injectable()
export class DlqEventsService {
  constructor(private readonly socketIOService: SocketIOService) {}

  /** A DLQ row was created or changed (incl. delete = status 'Removed'). */
  broadcastEntryUpserted(entry: DeadLetterJob): void {
    this.socketIOService.emit(
      DLQ_ENTRY_UPSERTED_TOPIC,
      buildSocketEvent(DLQ_ENTRY_UPSERTED_TOPIC, {
        entry: serializeDlqEntry(entry),
      }),
    );
  }

  /** Rows were hard-deleted (the retention sweep's erase step). */
  broadcastEntriesRemoved(ids: string[]): void {
    this.socketIOService.emit(
      DLQ_ENTRIES_REMOVED_TOPIC,
      buildSocketEvent(DLQ_ENTRIES_REMOVED_TOPIC, { ids }),
    );
  }

  /** Many rows changed at once (cleanup status moves, batch reinstate). */
  broadcastBulkChanged(): void {
    this.socketIOService.emit(
      DLQ_BULK_CHANGED_TOPIC,
      buildSocketEvent(DLQ_BULK_CHANGED_TOPIC, {}),
    );
  }
}
