type Input = string | string[];

/** Regex for splitting sentences including Western and CJK punctuation */
const sentenceRegex = /.*?(?:\.\.\.|[.?!…。？！])/gu;

/**
 * `TextToLines` splits text into sentences and provides a chainable API to append more text.
 *
 * Sentences preserve punctuation and support:
 * - Western: `.`, `?`, `!`, `...`
 * - CJK (Chinese, Japanese, Korean): `。`, `？`, `！`, `……`
 *
 * Example usage:
 * ```ts
 * const input = new TextToLines("Hello world! How are you?")
 *   .append("这是中文句子。还有另一个！")
 *   .append(["もう一つの文。", "And one more..."]);
 *
 * console.log(input.lines); // 6
 * console.log(input.build()); // ["Hello world!", "How are you?", ...]
 * ```
 */
export class TextToLines {
  /** Internal array of sentences */
  private linesArr: string[] = [];

  /**
   * Initialize the instance with a string or array of strings.
   * @param base - Initial text input
   */
  constructor(base: Input) {
    this.linesArr.push(...this.normalize(base));
  }

  /**
   * Number of sentences currently accumulated
   * @readonly
   */
  get lines(): number {
    return this.linesArr.length;
  }

  /**
   * Append more text or array of strings to the current sentences.
   * Chainable method.
   * @param val - String or array of strings to append
   * @returns The same `TextToLines` instance for chaining
   */
  append(val: Input): this {
    this.linesArr.push(...this.normalize(val));
    return this;
  }

  /**
   * Return all accumulated sentences as an array of strings. \
   * Throws an error if no sentences exist.
   * @returns Array of sentences
   * @throws {Error} If no valid sentences exist
   */
  build(): string[] {
    if (!this.linesArr.length) throw new Error('Converting text to lines');
    return this.linesArr;
  }

  private normalize(val: Input): string[] {
    return Array.isArray(val) ? val.flatMap((t) => this.splitSentences(t)) : this.splitSentences(val);
  }

  private splitSentences(text: string): string[] {
    const matches = text.match(sentenceRegex);
    if (matches) return matches.map((s) => s.trim()).filter(Boolean);
    return text.trim() ? [text.trim()] : [];
  }
}
