import { Brain } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';
import { ref } from 'vue';

import IconButton from './IconButton.vue';

type StoryArgs = {
  title?: string;
  active?: boolean;
  disabled?: boolean;
  blinking?: boolean;
  onMouseEnter?: boolean;
  onMouseLeave?: boolean;
  onClick?: () => void;
};

function renderStory() {
  return (args: StoryArgs) => ({
    components: { IconButton, Brain },
    setup() {
      const blinkingRef = ref(false);
      setInterval(() => {
        blinkingRef.value = !blinkingRef.value;
      }, 1000);

      function startHoverBlink() {
        blinkingRef.value = true;
      }
      function stopHoverBlink() {
        blinkingRef.value = false;
      }

      return { args, blinkingRef, startHoverBlink, stopHoverBlink };
    },
    template: `
      <div style="display: inline-flex; gap: 8px; padding: 24px;">
        <IconButton
          :title="args.title"
          :active="args.active"
          :disabled="args.disabled"
          :blinking="args.blinking ? blinkingRef : undefined"
          :on-mouse-enter="args.onMouseEnter ? startHoverBlink : undefined"
          :on-mouse-leave="args.onMouseLeave ? stopHoverBlink : undefined"
          @click="args.onClick"
        >
          <Brain style="width: 16px; height: 16px;" />
        </IconButton>
      </div>
    `,
  });
}

const meta = {
  title: 'Chat/Toolbar/Shared/UI/IconButton/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A compact toolbar button with icon-only display, following the ChatToolbar style.

Supports active highlighting, disabled state, blinking animation, and optional
onMouseEnter/onMouseLeave callbacks for providing visual feedback when a button
is disabled (e.g. select a model first).
`,
      },
    },
  },
  argTypes: {
    title: { control: 'text' },
    active: { control: 'boolean' },
    disabled: { control: 'boolean' },
    blinking: { control: 'boolean' },
    onMouseEnter: { control: 'boolean' },
    onMouseLeave: { control: 'boolean' },
  },
  args: {
    title: 'Default button',
    active: false,
    disabled: false,
    blinking: false,
    onMouseEnter: false,
    onMouseLeave: false,
    onClick: fn(),
  },
  render: renderStory(),
} satisfies Meta<StoryArgs>;

export default meta;
type Story = StoryObj<Meta<StoryArgs>>;

/** Default state — neutral appearance, ready to highlight on hover. */
export const Default: Story = {};

/** Active (menu open) — accent foreground + tertiary background. */
export const Active: Story = { args: { active: true } };

/** Disabled — dimmed and interaction blocked. */
export const Disabled: Story = { args: { disabled: true } };

/** Blinking — pulse ring animation indicating activity. */
export const Blinking: Story = { args: { blinking: true } };

/** Hover blink — when disabled, hovering calls onMouseEnter/onMouseLeave.
    Move your cursor over the button to see it light up. */
export const DisabledWithHoverBlink: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Disabled button with onMouseEnter/onMouseLeave. Hovering triggers a visual cue to draw attention.',
      },
    },
  },
  args: {
    disabled: true,
    onMouseEnter: true,
    onMouseLeave: true,
    title: 'Select model first',
  },
};
