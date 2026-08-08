import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import EvaluationListSection from './EvaluationListSection.vue';

describe('EvaluationListSection', () => {
  it('renders nothing when items is empty', () => {
    const wrapper = mount(EvaluationListSection, {
      props: { title: 'Recommendations', items: [] },
    });

    expect(wrapper.find('section').exists()).toBe(false);
  });

  it('renders items with the variant icon', () => {
    const wrapper = mount(EvaluationListSection, {
      props: {
        title: 'Recommendations',
        variant: 'recommendation',
        items: [{ text: 'Wait for reviews' }, { text: 'Try the beta' }],
      },
    });

    expect(wrapper.findAll('li')).toHaveLength(2);
    expect(wrapper.find('li .icon').text()).toBe('→');
  });

  it('applies the semantic variant class for strengths and weaknesses', () => {
    const strengths = mount(EvaluationListSection, {
      props: {
        title: 'Strengths',
        variant: 'strength',
        items: [{ text: 'Fast' }],
      },
    });
    expect(strengths.find('section').classes()).toContain('strength');

    const weaknesses = mount(EvaluationListSection, {
      props: {
        title: 'Weaknesses',
        variant: 'weakness',
        items: [{ text: 'Buggy' }],
      },
    });
    expect(weaknesses.find('section').classes()).toContain('weakness');
  });

  it('assigns a cycling color to recommendation icons', () => {
    const wrapper = mount(EvaluationListSection, {
      props: {
        title: 'Recommendations',
        variant: 'recommendation',
        items: Array.from({ length: 10 }, (_, index) => ({
          text: `Recommendation ${index}`,
        })),
      },
    });

    const items = wrapper.findAll('li');
    expect(items[0].attributes('style')).toContain(
      '--item-color: var(--color-accent-primary)',
    );
    expect(items[5].attributes('style')).toContain(
      '--item-color: var(--color-status-info)',
    );
    // The 10th recommendation wraps back to the start of the cycle.
    expect(items[9].attributes('style')).toContain(
      '--item-color: var(--color-accent-primary)',
    );
  });
});
