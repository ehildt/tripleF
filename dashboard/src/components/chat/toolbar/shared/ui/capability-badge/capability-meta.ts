import {
  AudioLines,
  BrainCircuit,
  Eye,
  type LucideIcon,
  Sparkles,
  Wrench,
} from '@lucide/vue';

export interface CapabilityMeta {
  icon: LucideIcon;
  label: string;
}

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
};
