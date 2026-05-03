import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import BlurSigmaInput from './blur-sigma-input/BlurSigmaInput.vue';
import BrightnessInput from './brightness-input/BrightnessInput.vue';
import ClaheHeightInput from './clahe-height-input/ClaheHeightInput.vue';
import ClaheMaxSlopeInput from './clahe-max-slope-input/ClaheMaxSlopeInput.vue';
import ClaheWidthInput from './clahe-width-input/ClaheWidthInput.vue';
import NormalizeLowerInput from './normalize-lower-input/NormalizeLowerInput.vue';
import NormalizeUpperInput from './normalize-upper-input/NormalizeUpperInput.vue';
import SharpenM1Input from './sharpen-m1-input/SharpenM1Input.vue';
import SharpenM2Input from './sharpen-m2-input/SharpenM2Input.vue';
import SharpenSigmaInput from './sharpen-sigma-input/SharpenSigmaInput.vue';

const components = [
  { name: 'BlurSigmaInput', comp: BlurSigmaInput, placeholder: '0.5' },
  { name: 'BrightnessInput', comp: BrightnessInput, placeholder: '1.2' },
  { name: 'ClaheHeightInput', comp: ClaheHeightInput, placeholder: '8' },
  { name: 'ClaheMaxSlopeInput', comp: ClaheMaxSlopeInput, placeholder: '3.0' },
  { name: 'ClaheWidthInput', comp: ClaheWidthInput, placeholder: '8' },
  { name: 'NormalizeLowerInput', comp: NormalizeLowerInput, placeholder: '1' },
  { name: 'NormalizeUpperInput', comp: NormalizeUpperInput, placeholder: '99' },
  { name: 'SharpenM1Input', comp: SharpenM1Input, placeholder: '1' },
  { name: 'SharpenM2Input', comp: SharpenM2Input, placeholder: '2' },
  { name: 'SharpenSigmaInput', comp: SharpenSigmaInput, placeholder: '1' },
];

for (const { name, comp } of components) {
  describe(name, () => {
    it('renders InputNumber with correct props', () => {
      const wrapper = mount(comp, {
        props: { modelValue: 5 },
      });
      expect(wrapper.find('input').exists()).toBe(true);
      expect((wrapper.find('input').element as HTMLInputElement).value).toBe(
        '5',
      );
    });

    it('emits update:modelValue', async () => {
      const wrapper = mount(comp, {
        props: { modelValue: 5 },
      });
      const input = wrapper.find('input');
      await input.setValue('10');
      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    });

    it('passes disabled prop', () => {
      const wrapper = mount(comp, {
        props: { modelValue: 5, disabled: true },
      });
      expect(wrapper.find('input').attributes('disabled')).toBeDefined();
    });
  });
}
