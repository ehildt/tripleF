import type { Meta, StoryObj } from '@storybook/vue3-vite';

import MediaCaptionScrim from './MediaCaptionScrim.vue';

const meta = {
  title: 'Chat/AssistantResponse/Shared/UI/MediaCaptionScrim',
  component: MediaCaptionScrim,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Bottom-anchored caption overlay for media surfaces. Near-solid through the
text band, then an eased fade to transparent so the caption has no hard top
edge. With \`edge="top"\` it anchors to the media's top edge instead and the
gradient fades downward. Renders a \`figcaption\` inside image figures and a
\`div\` elsewhere. Content styling (title, caption text, actions) belongs to
the consumer via the default slot.
`,
      },
    },
  },
  argTypes: {
    as: { control: 'select', options: ['div', 'figcaption'] },
    edge: { control: 'select', options: ['bottom', 'top'] },
  },
  args: {
    as: 'div',
    edge: 'bottom',
  },
} satisfies Meta<typeof MediaCaptionScrim>;

export default meta;
type Story = StoryObj<typeof meta>;

const backdrop = (label: string) => `
  <img
    src="https://via.placeholder.com/640x360/3f5d7a/ffffff?text=${label}"
    alt=""
    style="display: block; width: 100%; height: 100%; object-fit: cover;"
  />`;

/** Gallery image caption: figcaption with title + caption over an image. */
export const ImageCaption: Story = {
  args: { as: 'figcaption' },
  render: (args) => ({
    components: { MediaCaptionScrim },
    setup: () => ({ args }),
    template: `
      <figure style="position: relative; height: 16rem; margin: 0; overflow: hidden;">
        ${backdrop('Image')}
        <MediaCaptionScrim v-bind="args">
          <strong style="color: var(--color-fg-primary); font-size: 0.9rem; font-weight: 600;">
            Sample title
          </strong>
          <p style="margin: 0; color: var(--color-fg-muted); font-size: 0.8rem;">
            A short caption describing the image
          </p>
        </MediaCaptionScrim>
      </figure>`,
  }),
};

/** Top-anchored variant: content pinned to the media's top corner, fading
    downward — used by the video gallery cards. */
export const TopCaption: Story = {
  args: { as: 'div', edge: 'top' },
  render: (args) => ({
    components: { MediaCaptionScrim },
    setup: () => ({ args }),
    template: `
      <div style="position: relative; height: 16rem; overflow: hidden;">
        ${backdrop('Video+frame')}
        <MediaCaptionScrim v-bind="args">
          <strong style="color: var(--color-fg-primary); font-size: 0.9rem; font-weight: 600;">
            Sample title
          </strong>
          <p style="margin: 0; color: var(--color-fg-muted); font-size: 0.8rem;">
            A caption line under the title
          </p>
        </MediaCaptionScrim>
      </div>`,
  }),
};

/** Video slide caption: div with a single-line caption. */
export const VideoCaption: Story = {
  args: { as: 'div' },
  render: (args) => ({
    components: { MediaCaptionScrim },
    setup: () => ({ args }),
    template: `
      <div style="position: relative; height: 16rem; overflow: hidden;">
        ${backdrop('Video+frame')}
        <MediaCaptionScrim v-bind="args">
          <p style="margin: 0; color: var(--color-fg-muted); font-size: 0.8rem;">
            A single-line video caption
          </p>
        </MediaCaptionScrim>
      </div>`,
  }),
};
