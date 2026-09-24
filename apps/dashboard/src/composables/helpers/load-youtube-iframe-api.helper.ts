import type { YouTubePlayerStateEvent } from './load-youtube-iframe-api.helper.types';

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement,
        options: {
          /** Required for youtube-nocookie.com embeds; omit for youtube.com. */
          host?: string;
          events?: {
            onReady?: () => void;
            onStateChange?: (event: YouTubePlayerStateEvent) => void;
          };
        },
      ) => {
        destroy(): void;
        playVideo(): void;
        pauseVideo(): void;
        getPlayerState(): number;
      };
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<void> | null = null;

/**
 * Load the YouTube IFrame Player API exactly once and resolve when it is
 * ready to construct players.
 */
export function loadYouTubeIframeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();

  apiPromise ??= new Promise<void>((resolve) => {
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      resolve();
    };

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    document.head.appendChild(script);
  });

  return apiPromise;
}
