import { limitText } from './limit-text.helper.ts';

describe('limitText', () => {
  it('returns the text unchanged when maxChars is undefined', () => {
    expect(limitText('hello world')).toBe('hello world');
  });

  it('returns the text unchanged when maxChars is zero', () => {
    expect(limitText('hello world', 0)).toBe('hello world');
  });

  it('returns the text unchanged when maxChars is negative', () => {
    expect(limitText('hello world', -5)).toBe('hello world');
  });

  it('returns the text unchanged when it fits within maxChars', () => {
    expect(limitText('hello', 5)).toBe('hello');
    expect(limitText('hello', 10)).toBe('hello');
  });

  it('slices at the exact maxChars boundary and appends a marker', () => {
    const result = limitText('abcdefghij', 4);
    expect(result.startsWith('abcd')).toBe(true);
    expect(result).toContain('showing 4 of 10 chars');
  });

  it('reports both the shown and total char counts in the marker', () => {
    const result = limitText('123456789', 3);
    expect(result).toContain('showing 3 of 9 chars');
    expect(result).toContain('Do not infer the omitted remainder');
  });
});
