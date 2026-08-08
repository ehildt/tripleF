export type PlayerTarget = Element | null;

export interface VideoPlayerSurfaceProps {
  videoUrl: string;
  embedSrc: string;
  isDirectVideo: boolean;
  isUnembeddable: boolean;
  /** Optional key used to force remount when the video source changes. */
  remountKey?: string;
}
