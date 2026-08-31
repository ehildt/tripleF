/** Project a group-by row into the pending-partition shape. */
export function mapGroupToPendingPartition(group: {
  memoryPartition: string;
  _count: { _all: number };
}) {
  return {
    memoryPartition: group.memoryPartition,
    pending: group._count._all,
  };
}
