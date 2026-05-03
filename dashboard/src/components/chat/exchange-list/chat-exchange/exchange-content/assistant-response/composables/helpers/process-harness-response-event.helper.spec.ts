import { createHarnessResponseState } from './create-harness-response-state.helper';
import { processHarnessResponseEvent } from './process-harness-response-event.helper';

describe('processHarnessResponseEvent', () => {
  it('extracts text from JSON for the text template', () => {
    let state = createHarnessResponseState('req-1');

    state = processHarnessResponseEvent(state, {
      template: 'text',
      delta: '{ "text": "Hello',
    });
    expect(state.text).toBe('Hello');
    expect(state.done).toBe(false);

    state = processHarnessResponseEvent(state, {
      template: 'text',
      delta: ' world" }',
      done: true,
    });
    expect(state.text).toBe('Hello world');
    expect(state.done).toBe(true);
  });

  it('renders partial JSON for structured templates', () => {
    let state = createHarnessResponseState('req-1');

    state = processHarnessResponseEvent(state, {
      template: 'describe',
      delta: '{"title":"Image"',
    });
    expect(state.lastValidData?.title).toBe('Image');

    state = processHarnessResponseEvent(state, {
      template: 'describe',
      delta: ',"sectionContent":"A scene"}',
      done: true,
    });
    expect(state.lastValidData?.sectionContent).toBe('A scene');
    expect(state.done).toBe(true);
  });

  it('merges images and tool results into render data', () => {
    let state = createHarnessResponseState('req-1');

    state = processHarnessResponseEvent(state, {
      template: 'describe',
      delta: '{"title":"Image"}',
      images: [
        {
          imageUrl: '/api/v1/storage/req-1/0',
          imageAlt: 'photo',
          title: 'photo',
          caption: 'caption',
        },
      ],
      done: true,
    });

    expect(state.lastValidData?.galleryItems).toHaveLength(1);
    expect(state.lastValidData?.galleryItems?.[0].imageUrl).toBe(
      '/api/v1/storage/req-1/0',
    );
  });

  it('adds array presence flags for conditional template blocks', () => {
    let state = createHarnessResponseState('req-1');

    state = processHarnessResponseEvent(state, {
      template: 'article',
      delta: '{"title":"T","keyFindings":[{"text":"A"}]}',
      done: true,
    });

    expect(state.lastValidData?.keyFindings).toHaveLength(1);
    expect(state.lastValidData?.keyFindings?.[0].text).toBe('A');
  });

  it('filters out empty array items before rendering', () => {
    let state = createHarnessResponseState('req-1');

    state = processHarnessResponseEvent(state, {
      template: 'article',
      delta:
        '{"title":"T","keyFindings":[{"text":""},{"text":"A"}],"sources":[{"title":"","url":""}],"cards":[{"title":"","description":"","url":""}]}',
      done: true,
    });

    expect(state.lastValidData?.keyFindings).toHaveLength(1);
    expect(state.lastValidData?.keyFindings?.[0].text).toBe('A');
    expect(state.lastValidData?.sources).toHaveLength(0);
    expect(state.lastValidData?.cards).toHaveLength(0);
  });

  it('treats placeholder strings as empty key findings', () => {
    let state = createHarnessResponseState('req-1');

    state = processHarnessResponseEvent(state, {
      template: 'compare',
      delta:
        '{"title":"T","keyFindings":[{"text":"undefined"},{"text":"null"},{"text":"none"},{"text":"A"}]}',
      done: true,
    });

    expect(state.lastValidData?.keyFindings).toHaveLength(1);
    expect(state.lastValidData?.keyFindings?.[0].text).toBe('A');
  });

  it('preserves lastValidData when a later partial parse yields no content', () => {
    let state = createHarnessResponseState('req-1');

    state = processHarnessResponseEvent(state, {
      template: 'news',
      delta: '{"headline":"Breaking"}',
      done: true,
    });
    expect(state.lastValidData?.headline).toBe('Breaking');

    // After a valid payload is present, a subsequent empty/incomplete chunk
    // should not reset lastValidData back to null.
    state = processHarnessResponseEvent(state, {
      template: 'news',
      delta: '',
    });
    expect(state.lastValidData?.headline).toBe('Breaking');
  });

  it('strips markdown code fences before parsing JSON', () => {
    let state = createHarnessResponseState('req-1');

    state = processHarnessResponseEvent(state, {
      template: 'describe',
      delta: '```json\n{"title":"Fenced"}\n```',
      done: true,
    });

    expect(state.lastValidData?.title).toBe('Fenced');
  });
});
