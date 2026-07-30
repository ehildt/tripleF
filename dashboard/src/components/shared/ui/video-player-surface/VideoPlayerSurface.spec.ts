import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import VideoPlayerSurface from './VideoPlayerSurface.vue';

describe('VideoPlayerSurface', () => {
  it('renders a native video tag for direct video URLs', () => {
    const wrapper = mount(VideoPlayerSurface, {
      props: {
        videoUrl: 'https://example.com/video.mp4',
        embedSrc: '',
        isDirectVideo: true,
        isUnembeddable: false,
      },
    });
    expect(wrapper.find('video').exists()).toBe(true);
    expect(wrapper.find('video').attributes('src')).toBe(
      'https://example.com/video.mp4',
    );
  });

  it('renders an iframe for embedded providers', () => {
    const wrapper = mount(VideoPlayerSurface, {
      props: {
        videoUrl: 'https://example.com/video',
        embedSrc: 'https://example.com/embed/video',
        isDirectVideo: false,
        isUnembeddable: false,
      },
    });
    expect(wrapper.find('iframe').exists()).toBe(true);
    expect(wrapper.find('iframe').attributes('src')).toBe(
      'https://example.com/embed/video',
    );
  });

  it('renders a fallback link for unembeddable URLs', () => {
    const wrapper = mount(VideoPlayerSurface, {
      props: {
        videoUrl: 'https://example.com/watch',
        embedSrc: '',
        isDirectVideo: false,
        isUnembeddable: true,
      },
    });
    const link = wrapper.find('a');
    expect(link.exists()).toBe(true);
    expect(link.attributes('href')).toBe('https://example.com/watch');
  });

  it('emits setPlayerElement with the mounted element', () => {
    const wrapper = mount(VideoPlayerSurface, {
      props: {
        videoUrl: 'https://example.com/video.mp4',
        embedSrc: '',
        isDirectVideo: true,
        isUnembeddable: false,
      },
    });
    expect(wrapper.emitted('setPlayerElement')).toBeTruthy();
    const event = wrapper.emitted('setPlayerElement')![0];
    expect(event[0] instanceof HTMLVideoElement).toBe(true);
  });

  it('uses the provided remount key', () => {
    const wrapper = mount(VideoPlayerSurface, {
      props: {
        videoUrl: 'https://example.com/video.mp4',
        embedSrc: '',
        isDirectVideo: true,
        isUnembeddable: false,
        remountKey: 'custom-key',
      },
    });
    expect(wrapper.find('video').exists()).toBe(true);
  });
});
