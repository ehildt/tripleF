import { Clock } from '@lucide/vue';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import DlqMetadataField from './DlqMetadataField.vue';

describe('DlqMetadataField', () => {
  it('renders the label and value', () => {
    const wrapper = mount(DlqMetadataField, {
      props: { icon: Clock, label: 'Failed At', value: '2024-01-15' },
    });
    expect(wrapper.text()).toContain('Failed At');
    expect(wrapper.text()).toContain('2024-01-15');
  });
});
