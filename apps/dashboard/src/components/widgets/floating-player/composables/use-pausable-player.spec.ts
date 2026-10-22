import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';

vi.mock('@/composables/helpers/load-youtube-iframe-api.helper', () => ({
  loadYouTubeIframeApi: vi.fn(async () => undefined),
}));

import { usePausablePlayer } from './use-pausable-player';

interface Report {
  onPlayingChange?: (playing: boolean) => void;
  onEnded?: () => void;
  reportPlaying: (playing: boolean) => void;
  reportControlSupported: (supported: boolean) => void;
}

function makeReport(): Report & {
  playingLog: boolean[];
  supportedLog: boolean[];
  endedCount: { value: number };
} {
  const playingLog: boolean[] = [];
  const supportedLog: boolean[] = [];
  const endedCount = { value: 0 };
  return {
    playingLog,
    supportedLog,
    endedCount,
    onEnded: () => {
      endedCount.value += 1;
    },
    reportPlaying: (playing) => playingLog.push(playing),
    reportControlSupported: (supported) => supportedLog.push(supported),
  };
}

function mountPlayer(url: string, report: Report) {
  let player!: ReturnType<typeof usePausablePlayer>;
  const wrapper = mount(
    defineComponent({
      setup() {
        player = usePausablePlayer(ref(url), report);
        return () => h('div');
      },
    }),
  );
  return { player, wrapper };
}

describe('usePausablePlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as { YT?: unknown }).YT;
  });

  it('derives the embed source with provider API flags', () => {
    const yt = makeReport();
    const youtube = mountPlayer(
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      yt,
    );
    expect(youtube.player.isYouTubeEmbed.value).toBe(true);
    expect(youtube.player.playerSrc.value).toContain(
      'https://www.youtube.com/embed/dQw4w9WgXcQ?',
    );
    expect(youtube.player.playerSrc.value).toContain('enablejsapi=1');
    expect(youtube.player.playerSrc.value).toContain('origin=');

    const vimeo = mountPlayer('https://vimeo.com/123456789', makeReport());
    expect(vimeo.player.playerSrc.value).toBe(
      'https://player.vimeo.com/video/123456789?api=1',
    );

    const direct = mountPlayer(
      'https://cdn.example.com/clip.mp4',
      makeReport(),
    );
    expect(direct.player.isDirectVideo.value).toBe(true);
    expect(direct.player.playerSrc.value).toBe(
      'https://cdn.example.com/clip.mp4',
    );
  });

  it('flags an unembeddable host', () => {
    const { player } = mountPlayer(
      'https://www.tiktok.com/@x/video/1',
      makeReport(),
    );
    expect(player.isUnembeddable.value).toBe(true);
    expect(player.playerSrc.value).toBe('');
  });

  it('wires a direct <video> through native events and registers transport controls', async () => {
    const report = makeReport();
    const { player } = mountPlayer('https://cdn.example.com/clip.mp4', report);
    const video = document.createElement('video');
    player.setPlayerElement(video);
    await nextTick();

    // Mount means autoplay intent: controls registered + playing reported.
    expect(report.supportedLog).toEqual([true]);
    expect(report.playingLog).toEqual([true]);

    video.dispatchEvent(new Event('pause'));
    expect(report.playingLog.at(-1)).toBe(false);

    video.dispatchEvent(new Event('play'));
    expect(report.playingLog.at(-1)).toBe(true);
  });

  it('reports native ended once per playback, re-arming on replay', async () => {
    const report = makeReport();
    const { player } = mountPlayer('https://cdn.example.com/clip.mp4', report);
    const video = document.createElement('video');
    player.setPlayerElement(video);
    await nextTick();

    video.dispatchEvent(new Event('ended'));
    expect(report.playingLog.at(-1)).toBe(false);
    expect(report.endedCount.value).toBe(1);

    // Native semantics: a replay reaches the end again → a second report.
    video.dispatchEvent(new Event('play'));
    video.dispatchEvent(new Event('ended'));
    expect(report.endedCount.value).toBe(2);
  });

  it('toggles play/pause on the direct video element following reported state', async () => {
    const { player } = mountPlayer(
      'https://cdn.example.com/clip.mp4',
      makeReport(),
    );
    const video = document.createElement('video');
    const playSpy = vi.spyOn(video, 'play').mockResolvedValue(undefined);
    const pauseSpy = vi.spyOn(video, 'pause');

    player.setPlayerElement(video);
    await nextTick();

    player.togglePlayback(); // playing=true after mount → pause
    expect(pauseSpy).toHaveBeenCalledOnce();

    video.dispatchEvent(new Event('pause'));
    player.togglePlayback(); // now reported paused → play
    expect(playSpy).toHaveBeenCalledOnce();
  });

  it('accepts non-element template-ref targets as no element', async () => {
    const { player } = mountPlayer(
      'https://cdn.example.com/clip.mp4',
      makeReport(),
    );
    player.setPlayerElement(null);
    await nextTick();
    expect(player.isDirectVideo.value).toBe(true); // url-based, unaffected
  });

  it('registers YouTube API controls and reports PLAYING/ENDED state changes', async () => {
    let callbacks!: { onStateChange: (event: { data: number }) => void };
    const playVideo = vi.fn();
    const pauseVideo = vi.fn();
    const YTStub = {
      PlayerState: { PLAYING: 1, PAUSED: 2, ENDED: 0 },
      Player: class {
        constructor(_el: unknown, cfg: { events: typeof callbacks }) {
          callbacks = cfg.events;
        }
        playVideo = playVideo;
        pauseVideo = pauseVideo;
        destroy = vi.fn();
        getPlayerState() {
          return 3;
        }
      },
    };
    (window as { YT?: unknown }).YT = YTStub;

    const report = makeReport();
    const { player } = mountPlayer(
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      report,
    );
    const frame = document.createElement('iframe');
    player.setPlayerElement(frame);
    await nextTick();
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(report.supportedLog).toEqual([true]);

    callbacks.onStateChange({ data: YTStub.PlayerState.PLAYING });
    expect(report.playingLog.at(-1)).toBe(true);

    callbacks.onStateChange({ data: YTStub.PlayerState.ENDED });
    callbacks.onStateChange({ data: YTStub.PlayerState.ENDED });
    expect(report.endedCount.value).toBe(1);

    player.togglePlayback(); // last reported state: ended/false → play
    expect(playVideo).toHaveBeenCalledOnce();
  });
});
