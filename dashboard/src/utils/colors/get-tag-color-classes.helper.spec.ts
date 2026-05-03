import { getTagColorClasses } from './get-tag-color-classes.helper';

describe('getTagColorClasses', () => {
  it('handles type variant', () => {
    expect(getTagColorClasses('type', 'socket').text).toBe('text-tab-rest');
    expect(getTagColorClasses('type', 'http').text).toBe('text-tab-accent');
  });

  it('handles direction variant', () => {
    expect(getTagColorClasses('direction', 'response').text).toBe(
      'text-tab-rest',
    );
    expect(getTagColorClasses('direction', 'request').text).toBe(
      'text-tab-accent',
    );
  });

  it('handles status variant', () => {
    expect(getTagColorClasses('status', 'success').text).toBe('text-tab-rest');
    expect(getTagColorClasses('status', 'error').text).toBe('text-tab-debug');
  });

  it('falls back to debug for unknown variant', () => {
    const c = getTagColorClasses('unknown' as any, 'x');
    expect(c.text).toBe('text-tab-debug');
  });
});
