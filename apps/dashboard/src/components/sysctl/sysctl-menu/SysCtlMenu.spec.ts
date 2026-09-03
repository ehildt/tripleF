import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import SysCtlMenu from './SysCtlMenu.vue';

describe('SysCtlMenu', () => {
  it('emits selectTab with the chosen tab when a tab button is clicked', async () => {
    const wrapper = mount(SysCtlMenu, {
      props: { activeTab: 'integrations' },
    });

    const systemButton = wrapper
      .findAll('.sysctl-menu__tab')
      .find((button) => button.attributes('aria-label') === 'System');

    expect(systemButton).toBeDefined();
    await systemButton!.trigger('click');

    expect(wrapper.emitted('selectTab')).toHaveLength(1);
    expect(wrapper.emitted('selectTab')![0]).toEqual(['system']);
  });

  it('emits selectTab for each tab', async () => {
    const wrapper = mount(SysCtlMenu, {
      props: { activeTab: 'integrations' },
    });

    const tabs = ['Integrations', 'Preprocessing', 'Widgets', 'System'];

    for (const label of tabs) {
      const button = wrapper
        .findAll('.sysctl-menu__tab')
        .find((b) => b.attributes('aria-label') === label);
      expect(button).toBeDefined();
      await button!.trigger('click');
    }

    expect(wrapper.emitted('selectTab')).toHaveLength(4);
  });
});
