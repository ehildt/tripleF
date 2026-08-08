import {
  Activity,
  Brain,
  Cpu,
  Database,
  FolderOpen,
  HardDrive,
  type LucideIcon,
  Server,
} from '@lucide/vue';

/** The icon for a health-tile name; unknown names fall back to Server. */
export function resolveHealthTileIcon(name: string): LucideIcon {
  switch (name) {
    case 'disk':
      return HardDrive;
    case 'ollama':
      return Brain;
    case 'memory_heap':
    case 'memory_rss':
      return Cpu;
    case 'postgres':
      return Database;
    case 'minio':
      return FolderOpen;
    case 'service':
      return Activity;
    default:
      return Server;
  }
}
