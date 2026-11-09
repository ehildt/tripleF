import type { MediaPriority } from '@/types/assistant-response-data.model';

/** Parse the default media priority, preserving the existing images default. */
export function parseMediaPriority(saved: string | null): MediaPriority {
  return saved === 'videos' ? 'videos' : 'images';
}
