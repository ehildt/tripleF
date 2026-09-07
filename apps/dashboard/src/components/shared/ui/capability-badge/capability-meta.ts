import {
  AudioLines,
  BrainCircuit,
  Eye,
  Sparkles,
  VectorSquare,
  Wrench,
} from '@lucide/vue';

import type { CapabilityMeta } from './capability-meta.types';

/**
 * Icon and label per known model capability — the single source for every
 * capability rendering (toolbar capabilities row, model selector dropdown),
 * so both surfaces look identical. Unknown capability strings fall back to
 * a text badge at the call site.
 */
export const CAPABILITY_META: Record<string, CapabilityMeta> = {
  vision: { icon: Eye, label: 'vision' },
  audio: { icon: AudioLines, label: 'audio' },
  tools: { icon: Wrench, label: 'tools' },
  thinking: { icon: BrainCircuit, label: 'thinking' },
  completion: { icon: Sparkles, label: 'completion' },
  embedding: { icon: VectorSquare, label: 'embedding' },
};
