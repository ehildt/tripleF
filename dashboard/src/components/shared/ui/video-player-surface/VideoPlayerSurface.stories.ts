import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import VideoPlayerSurface from './VideoPlayerSurface.vue';

const meta = {
  title: 'Shared/UI/VideoPlayerSurface',
  component: VideoPlayerSurface,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Shared media renderer that picks between a native <video>, an embedded
<iframe>, or a fallback source link depending on the video URL.
`,
      },
    },
  },
  args: {
    videoUrl: 'https://example.com/video.mp4',
    embedSrc: '',
    isDirectVideo: true,
    isUnembeddable: false,
    onSetPlayerElement: fn(),
  },
} satisfies Meta<typeof VideoPlayerSurface>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Direct video file rendered with the native player. */
export const DirectVideo: Story = {};

/** Embedded provider rendered in an iframe. */
export const Embedded: Story = {
  args: {
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    embedSrc: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    isDirectVideo: false,
  },
};

/** Unembeddable URL degrades to an external link. */
export const Unembeddable: Story = {
  args: {
    videoUrl: 'https://example.com/protected',
    embedSrc: '',
    isDirectVideo: false,
    isUnembeddable: true,
  },
};
