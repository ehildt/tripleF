import { CAPABILITY_META } from '../../../../shared/ui/capability-badge/capability-meta';
import type { ModelCapability } from './model-capabilities.helper';

/** Build one capability badge from its key. */
export function mapCapabilityToBadge(key: ModelCapability) {
  return { key, ...CAPABILITY_META[key] };
}
