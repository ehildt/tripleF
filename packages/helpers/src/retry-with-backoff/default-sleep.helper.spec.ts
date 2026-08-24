import { defaultSleep } from './default-sleep.helper.ts';

describe('defaultSleep', () => {
  it('resolves after the delay', async () => {
    await expect(defaultSleep(1)).resolves.toBeUndefined();
  });

  it('rejects when the signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(defaultSleep(100, controller.signal)).rejects.toThrow();
  });

  it('rejects when the signal aborts during the delay', async () => {
    const controller = new AbortController();
    const promise = defaultSleep(10_000, controller.signal);
    controller.abort();
    await expect(promise).rejects.toThrow();
  });
});
