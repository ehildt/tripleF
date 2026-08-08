import type { ComponentPublicInstance } from 'vue';

export type TemplateRefTarget = Element | ComponentPublicInstance | null;

export type PlayerControls = { play(): void; pause(): void };

export type YouTubePlayerHandle = {
  destroy(): void;
  playVideo(): void;
  pauseVideo(): void;
  getPlayerState(): number;
};
