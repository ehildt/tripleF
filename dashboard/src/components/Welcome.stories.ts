import type { Meta, StoryObj } from '@storybook/vue3-vite';

const meta = {
  title: 'Welcome',
  parameters: {
    options: { showPanel: false },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Introduction: Story = {
  render: () => ({
    template: `
      <div class="root-accent-gradient" style="min-height: 100vh; padding: 3rem;">
        <div style="max-width: 48rem; margin: 0 auto;">
          <div style="margin-bottom: 2.5rem;">
            <h1 style="font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--color-accent-primary); font-family: var(--font-mono);">
              ckir.io Harness
            </h1>
            <p style="font-size: 1.25rem; opacity: 0.7;">
              Component Library — Storybook
            </p>
          </div>

          <div class="panel-glow" style="background: var(--color-bg-secondary); padding: 1.5rem; border-radius: 0.5rem; margin-bottom: 1.5rem;">
            <h2 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem; color: var(--color-accent-primary);">
              Design Philosophy: Practical Minimalism
            </h2>
            <p style="margin-bottom: 0.75rem; line-height: 1.7;">
              Every component in this library is built for a <strong>specific, concrete purpose</strong> —
              not for an imagined future of generic reuse. We follow the
              <strong> YAGNI</strong> (You Ain't Gonna Need It) principle.
            </p>
            <ul style="list-style: disc; padding-left: 1.5rem; line-height: 2;">
              <li>Props and features are added <strong>only when a real use case demands them</strong>.</li>
              <li>No speculative abstractions, no premature generalization.</li>
              <li>Components are <strong>extended incrementally</strong> as new requirements emerge.</li>
              <li>Refactoring toward shared patterns happens when the need <em>actually</em> arises — not before.</li>
            </ul>
          </div>

          <div class="panel-glow" style="background: var(--color-bg-secondary); padding: 1.5rem; border-radius: 0.5rem; margin-bottom: 1.5rem;">
            <h2 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem; color: var(--color-accent-primary);">
              Why this approach?
            </h2>
            <p style="line-height: 1.7;">
              Building for today's needs keeps the codebase lean, readable, and maintainable.
              When a component is grown to fit a real requirement — rather than pre-built for
              hypothetical ones — it is more likely to match the actual architecture and less
              likely to contain dead code or wrong assumptions.
            </p>
          </div>

          <div class="panel-glow" style="background: var(--color-bg-secondary); padding: 1.5rem; border-radius: 0.5rem;">
            <h2 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem; color: var(--color-accent-primary);">
              Explore Components
            </h2>
            <p style="line-height: 1.7;">
              Browse the sidebar to see the available components and their stories.
              Each story demonstrates a component in a specific state or configuration —
              exactly as it is used in the application today.
            </p>
          </div>
        </div>
      </div>
    `,
  }),
};
