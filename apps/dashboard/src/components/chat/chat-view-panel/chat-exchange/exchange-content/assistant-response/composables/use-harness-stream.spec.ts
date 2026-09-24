import { describe, expect, it } from 'vitest';

import { useHarnessStream } from './use-harness-stream';

describe('useHarnessStream', () => {
  it('starts empty', () => {
    const stream = useHarnessStream('req-1');

    expect(stream.state.value.text).toBe('');
    expect(stream.state.value.lastValidData).toBeNull();
    expect(stream.done.value).toBe(false);
  });

  it('ingests text deltas', () => {
    const stream = useHarnessStream('req-1');

    stream.ingest({
      template: 'text',
      delta: '{ "text": "Hello',
      done: false,
    });
    expect(stream.state.value.text).toBe('Hello');

    stream.ingest({ template: 'text', delta: ' world" }', done: true });
    expect(stream.state.value.text).toBe('Hello world');
    expect(stream.done.value).toBe(true);
  });

  it('resets to initial state', () => {
    const stream = useHarnessStream('req-1');

    stream.ingest({ template: 'text', delta: 'Hello', done: true });
    stream.reset();

    expect(stream.state.value.text).toBe('');
    expect(stream.done.value).toBe(false);
  });

  it('ingests structured JSON deltas', () => {
    const stream = useHarnessStream('req-1');

    stream.ingest({ template: 'describe', delta: '{"title":"X"', done: false });
    expect(stream.state.value.lastValidData?.title).toBe('X');

    stream.ingest({
      template: 'describe',
      delta: ',"sectionContent":"Y"}',
      done: true,
    });
    expect(stream.state.value.lastValidData?.sectionContent).toBe('Y');
  });
});
