import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';

/**
 * Run a callback inside a mounted component's `setup`, so `inject`/`provide`
 * work. The optional `provideValues` callback runs in a parent component's
 * setup — `inject` only sees ancestor provides, not the current component's
 * own, so values provided there are visible to `inject` inside `run`.
 */
export function runInSetup<T>(run: () => T, provideValues?: () => void): T {
  let result!: T;
  const Consumer = defineComponent({
    setup() {
      result = run();
      return () => h('div');
    },
  });
  const Provider = defineComponent({
    setup() {
      provideValues?.();
      return () => h(Consumer);
    },
  });
  mount(Provider);
  return result;
}
