import { escapeLiteralControlsInStrings } from './escape-literal-controls-in-strings.helper.ts';

describe('escapeLiteralControlsInStrings', () => {
  it('escapes literal newlines inside strings', () => {
    expect(escapeLiteralControlsInStrings('{"a": "x\ny"}')).toBe('{"a": "x\\ny"}');
  });

  it('leaves structural characters untouched', () => {
    expect(escapeLiteralControlsInStrings('{"a": [1, 2]}')).toBe('{"a": [1, 2]}');
  });

  it('leaves text outside strings untouched', () => {
    expect(escapeLiteralControlsInStrings('prefix {"a": 1}')).toBe('prefix {"a": 1}');
  });
});
