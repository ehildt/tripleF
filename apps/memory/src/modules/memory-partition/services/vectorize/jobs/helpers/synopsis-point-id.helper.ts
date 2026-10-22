import { deterministicPointId } from '../../../../../qdrant/helpers/deterministic-point-id.helper.js';

/**
 * Deterministic synopsis-point id for a cluster (`synopsis|<clusterId>`,
 * hashed to a UUID — Qdrant accepts ints/UUIDs only) — identical cluster
 * identity ⇒ identical point id ⇒ overwrite-in-place.
 */
export function synopsisPointId(clusterId: string): string {
  return deterministicPointId(`synopsis|${clusterId}`);
}
