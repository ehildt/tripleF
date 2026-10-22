/**
 * Build the sorted display list of active socket subscriptions. Events with
 * joined rooms produce one `event::room` entry per room, events without any
 * room produce a bare `event` entry.
 */
export function buildConnectedPairs(
  connectedEvents: Set<string>,
  connectedRooms: Map<string, Set<string>>,
): string[] {
  const pairs: string[] = [];
  const sortedEvents = Array.from(connectedEvents).sort();

  for (const event of sortedEvents) {
    const rooms = connectedRooms.get(event);
    if (rooms && rooms.size > 0) {
      for (const room of Array.from(rooms).sort()) {
        pairs.push(`${event}::${room}`);
      }
    } else {
      pairs.push(event);
    }
  }

  return pairs;
}
