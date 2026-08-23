import { TextToLines } from './text-to-lines.helper.ts';

describe('TextToLines', () => {
  it('should split a simple English sentence correctly', () => {
    const result = new TextToLines('Hello world! How are you?').build();
    expect(result).toEqual(['Hello world!', 'How are you?']);
  });

  it('should handle multiple English sentences in an array', () => {
    const result = new TextToLines(['This is first.', 'This is second!']).build();
    expect(result).toEqual(['This is first.', 'This is second!']);
  });

  it('should trim whitespace and remove empty lines', () => {
    const result = new TextToLines('  Hello!  How are you?   ').build();
    expect(result).toEqual(['Hello!', 'How are you?']);
  });

  it('should chain append() calls correctly', () => {
    const result = new TextToLines('Hello world!').append('How are you?').append(['I am fine.', 'Thanks!']).build();
    expect(result).toEqual(['Hello world!', 'How are you?', 'I am fine.', 'Thanks!']);
  });

  it('should handle CJK punctuation correctly', () => {
    const result = new TextToLines('这是中文句子。还有另一个！')
      .append('もう一つの文。')
      .append('And one more...')
      .build();
    expect(result).toEqual(['这是中文句子。', '还有另一个！', 'もう一つの文。', 'And one more...']);
  });

  it('should handle mixed English and CJK sentences', () => {
    const result = new TextToLines('Hello! 这是中文句子。').build();
    expect(result).toEqual(['Hello!', '这是中文句子。']);
  });

  it('should return correct lines count using .lines getter', () => {
    const builder = new TextToLines('Hello world! How are you?');
    expect(builder.lines).toBe(2);
    builder.append('Another sentence.');
    expect(builder.lines).toBe(3);
  });

  it('should throw an error for empty input', () => {
    expect(() => new TextToLines('').build()).toThrow('Converting text to lines');
  });

  it('should handle multiple appends and preserve punctuation', () => {
    const builder = new TextToLines('First sentence.')
      .append('Second sentence!')
      .append(['Third sentence?', 'Fourth...']);
    expect(builder.build()).toEqual(['First sentence.', 'Second sentence!', 'Third sentence?', 'Fourth...']);
  });

  it('should correctly handle arrays of mixed strings and punctuation', () => {
    const input = new TextToLines(['Hello world! How are you?', '这是中文句子。还有另一个！', 'もう一つの文。']);
    expect(input.build()).toEqual(['Hello world!', 'How are you?', '这是中文句子。', '还有另一个！', 'もう一つの文。']);
  });

  it('should handle text with ellipsis correctly', () => {
    const input = new TextToLines('Wait... What happened?');
    expect(input.build()).toEqual(['Wait...', 'What happened?']);
  });

  it('should be chainable and return the same instance', () => {
    const builder = new TextToLines('Hello.');
    const returned = builder.append('How are you?');
    expect(returned).toBe(builder);
    expect(returned.lines).toBe(2);
  });

  it('should handle sentences without punctuation as valid sentences', () => {
    const result = new TextToLines('This is a sentence without punctuation').build();
    expect(result).toEqual(['This is a sentence without punctuation']);
  });

  it('should handle array input with sentences lacking punctuation', () => {
    const result = new TextToLines(['No punctuation here', 'And another one']).build();
    expect(result).toEqual(['No punctuation here', 'And another one']);
  });

  it('should handle mixed input with and without punctuation', () => {
    const result = new TextToLines('Hello!').append('This has no punctuation').build();
    expect(result).toEqual(['Hello!', 'This has no punctuation']);
  });
});
