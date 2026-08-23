import Joi from 'joi';

import { CacheReturnValue } from './cache-return-value.decorator.ts';

class TestClass {
  callCount = 0;
  private _value = 0;

  @CacheReturnValue()
  simpleGetter = 42;

  @CacheReturnValue()
  simpleMethod(x: number) {
    this.callCount++;
    return x * 2;
  }

  @CacheReturnValue()
  anotherMethod(x: number) {
    this.callCount++;
    return x * 3;
  }

  @CacheReturnValue(Joi.number().min(10))
  validatedMethod(x: number) {
    this.callCount++;
    return x;
  }

  @CacheReturnValue(Joi.number().min(1))
  get validatedGetter() {
    return this._value;
  }

  set validatedGetter(val: number) {
    this._value = val;
  }
}

const testSymbol = Symbol('test');

class SymbolTestClass {
  callCount = 0;

  @CacheReturnValue()
  get [testSymbol]() {
    this.callCount++;
    return 42;
  }
}

describe('ValidateAndCacheReturnValue decorator', () => {
  let instance: TestClass;

  beforeEach(() => {
    instance = new TestClass();
  });

  it('caches getter values', () => {
    const first = instance.simpleGetter;
    const second = instance.simpleGetter;
    expect(first).toBe(42);
    expect(second).toBe(42);
  });

  it('caches method results per arguments', () => {
    const first = instance.simpleMethod(2);
    const second = instance.simpleMethod(2);
    const third = instance.simpleMethod(3);

    expect(first).toBe(4);
    expect(second).toBe(4); // Cached
    expect(third).toBe(6); // New arguments, not cached
    expect(instance.callCount).toBe(2); // Only called twice
  });

  it('validates method return when schema is provided', () => {
    expect(() => instance.validatedMethod(5)).toThrow(/Schema violation/);
    expect(instance.validatedMethod(15)).toBe(15);
  });

  it('validates getter return when schema is provided', () => {
    instance.validatedGetter = 0;
    expect(() => instance.validatedGetter).toThrow(/Schema violation/);

    instance.validatedGetter = 5;
    expect(instance.validatedGetter).toBe(5);
  });

  it('caches validated getter values', () => {
    instance.validatedGetter = 10;
    const first = instance.validatedGetter;
    instance.validatedGetter = 100; // Should not affect cached value
    const second = instance.validatedGetter;
    expect(first).toBe(10);
    expect(second).toBe(10);
  });

  it('does not validate if schema is not provided', () => {
    expect(instance.simpleMethod(1)).toBe(2);
    expect(instance.simpleGetter).toBe(42);
  });

  it('caches validated method results', () => {
    instance.validatedMethod(20);
    const result1 = instance.validatedMethod(20);
    expect(result1).toBe(20); // Cached value
  });

  it('maintains separate caches per instance', () => {
    const instance2 = new TestClass();
    expect(instance.simpleMethod(2)).toBe(4);
    expect(instance2.simpleMethod(2)).toBe(4);
    expect(instance.callCount).toBe(1);
    expect(instance2.callCount).toBe(1);
  });

  it('does not share cache between different methods', () => {
    instance.simpleMethod(2);
    instance.anotherMethod(2);
    expect(instance.callCount).toBe(2);
    expect(instance.simpleMethod(2)).toBe(4);
    expect(instance.anotherMethod(2)).toBe(6);
  });
});

describe('CacheReturnValue with TTL', () => {
  let mockTime: ReturnType<typeof vi.fn<() => number>>;

  beforeEach(() => {
    vi.useFakeTimers();
    mockTime = vi.fn(() => Date.now());
    vi.spyOn(Date, 'now').mockImplementation(mockTime);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns cached value before TTL expires', () => {
    class TestClass {
      callCount = 0;

      @CacheReturnValue()
      get value() {
        this.callCount++;
        return this.callCount;
      }
    }

    mockTime.mockReturnValue(1000);
    const instance = new TestClass();
    expect(instance.value).toBe(1);
    expect(instance.callCount).toBe(1);

    mockTime.mockReturnValue(1000 + 5 * 60 * 1000 - 1);
    expect(instance.value).toBe(1);
    expect(instance.callCount).toBe(1);
  });

  it('triggers refresh after TTL expires (stale-while-revalidate)', async () => {
    class TestClass {
      callCount = 0;

      @CacheReturnValue()
      get value() {
        this.callCount++;
        return this.callCount;
      }
    }

    mockTime.mockReturnValue(1000);
    const instance = new TestClass();
    expect(instance.value).toBe(1);
    expect(instance.callCount).toBe(1);

    mockTime.mockReturnValue(1000 + 5 * 60 * 1000 + 1);
    expect(instance.value).toBe(1);

    await vi.runAllTimersAsync();
    expect(instance.callCount).toBe(2);
  });

  it('returns stale value immediately when TTL expires', async () => {
    class TestClass {
      callCount = 0;

      @CacheReturnValue()
      get value() {
        this.callCount++;
        return this.callCount;
      }
    }

    mockTime.mockReturnValue(1000);
    const instance = new TestClass();
    expect(instance.value).toBe(1);

    mockTime.mockReturnValue(1000 + 5 * 60 * 1000 + 1);
    const immediateResult = instance.value;
    expect(immediateResult).toBe(1);

    await vi.runAllTimersAsync();
    expect(instance.callCount).toBe(2);
  });

  it('shares refresh promise during async refresh', async () => {
    let resolveMethod: (value: number) => void;
    class TestClass {
      callCount = 0;

      @CacheReturnValue()
      get value() {
        this.callCount++;
        return new Promise<number>((resolve) => {
          resolveMethod = resolve;
        });
      }
    }

    mockTime.mockReturnValue(1000);
    const instance = new TestClass();
    void instance.value;
    expect(instance.callCount).toBe(1);

    mockTime.mockReturnValue(1000 + 5 * 60 * 1000 + 1);

    void instance.value;
    void instance.value;
    void instance.value;

    expect(instance.callCount).toBe(2);

    resolveMethod!(42);
  });

  it('respects custom TTL from config object', async () => {
    class TestClass {
      callCount = 0;

      @CacheReturnValue({ ttl: 1000 })
      get value() {
        this.callCount++;
        return this.callCount;
      }
    }

    mockTime.mockReturnValue(1000);
    const instance = new TestClass();
    expect(instance.value).toBe(1);

    mockTime.mockReturnValue(1500);
    expect(instance.value).toBe(1);

    mockTime.mockReturnValue(2001);
    expect(instance.value).toBe(1);

    await vi.runAllTimersAsync();
    expect(instance.callCount).toBe(2);
  });

  it('accepts number as TTL shorthand', async () => {
    class TestClass {
      callCount = 0;

      @CacheReturnValue(1000)
      get value() {
        this.callCount++;
        return this.callCount;
      }
    }

    mockTime.mockReturnValue(1000);
    const instance = new TestClass();
    expect(instance.value).toBe(1);
    expect(instance.callCount).toBe(1);

    mockTime.mockReturnValue(1500);
    expect(instance.value).toBe(1);

    mockTime.mockReturnValue(2001);
    expect(instance.value).toBe(1);

    await vi.runAllTimersAsync();
    expect(instance.callCount).toBe(2);
  });

  it('does not expire when ttl is false', async () => {
    class TestClass {
      callCount = 0;

      @CacheReturnValue(false)
      get value() {
        this.callCount++;
        return this.callCount;
      }
    }

    mockTime.mockReturnValue(1000);
    const instance = new TestClass();
    expect(instance.value).toBe(1);

    mockTime.mockReturnValue(1000 + 5 * 60 * 1000 + 10000);
    expect(instance.value).toBe(1);

    await vi.runAllTimersAsync();
    expect(instance.callCount).toBe(1);
  });

  it('does not expire when config.ttl is false', async () => {
    class TestClass {
      callCount = 0;

      @CacheReturnValue({ ttl: false })
      get value() {
        this.callCount++;
        return this.callCount;
      }
    }

    mockTime.mockReturnValue(1000);
    const instance = new TestClass();
    expect(instance.value).toBe(1);

    mockTime.mockReturnValue(1000 + 5 * 60 * 1000 + 10000);
    expect(instance.value).toBe(1);

    await vi.runAllTimersAsync();
    expect(instance.callCount).toBe(1);
  });

  it('works with schema and TTL together', async () => {
    class TestClass {
      callCount = 0;

      @CacheReturnValue({ schema: Joi.number(), ttl: 1000 })
      get value() {
        this.callCount++;
        return this.callCount;
      }
    }

    mockTime.mockReturnValue(1000);
    const instance = new TestClass();
    expect(instance.value).toBe(1);
    expect(instance.callCount).toBe(1);

    mockTime.mockReturnValue(2001);
    expect(instance.value).toBe(1);

    await vi.runAllTimersAsync();
    expect(instance.callCount).toBe(2);
  });

  it('handles method TTL expiry with stale-while-revalidate', async () => {
    class TestClass {
      callCount = 0;

      @CacheReturnValue({ ttl: 1000 })
      method(x: number) {
        this.callCount++;
        return x * 2;
      }
    }

    mockTime.mockReturnValue(1000);
    const instance = new TestClass();
    expect(instance.method(5)).toBe(10);
    expect(instance.callCount).toBe(1);

    mockTime.mockReturnValue(2001);
    const staleResult = instance.method(5);
    expect(staleResult).toBe(10);

    await vi.runAllTimersAsync();
    expect(instance.callCount).toBe(2);
  });
});

describe('CacheReturnValue with symbol property keys', () => {
  let instance: SymbolTestClass;

  beforeEach(() => {
    instance = new SymbolTestClass();
  });

  it('caches symbol property getter values', () => {
    const first = instance[testSymbol];
    const second = instance[testSymbol];
    expect(first).toBe(42);
    expect(second).toBe(42);
    expect(instance.callCount).toBe(1);
  });

  it('maintains separate caches for symbol properties per instance', () => {
    const instance2 = new SymbolTestClass();
    void instance[testSymbol];
    void instance2[testSymbol];
    expect(instance.callCount).toBe(1);
    expect(instance2.callCount).toBe(1);
  });
});

describe('CacheReturnValue refresh error handling', () => {
  let mockTime: ReturnType<typeof vi.fn<() => number>>;

  beforeEach(() => {
    vi.useFakeTimers();
    mockTime = vi.fn(() => Date.now());
    vi.spyOn(Date, 'now').mockImplementation(mockTime);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('retains stale value when refresh throws error', async () => {
    class TestClass {
      callCount = 0;

      @CacheReturnValue({ ttl: 1000 })
      get value() {
        this.callCount++;
        if (this.callCount === 1) return 1;
        throw new Error('refresh failed');
      }
    }

    mockTime.mockReturnValue(1000);
    const instance = new TestClass();
    expect(instance.value).toBe(1);
    expect(instance.callCount).toBe(1);

    mockTime.mockReturnValue(2001);
    expect(instance.value).toBe(1);

    await vi.runAllTimersAsync();
    expect(instance.callCount).toBe(2);

    mockTime.mockReturnValue(3001);
    expect(instance.value).toBe(1);
    expect(instance.callCount).toBe(2);
  });

  it('retains stale value when method refresh throws error', async () => {
    class TestClass {
      callCount = 0;

      @CacheReturnValue({ ttl: 1000 })
      method(x: number) {
        this.callCount++;
        if (this.callCount === 1) return x * 2;
        throw new Error('refresh failed');
      }
    }

    mockTime.mockReturnValue(1000);
    const instance = new TestClass();
    expect(instance.method(5)).toBe(10);
    expect(instance.callCount).toBe(1);

    mockTime.mockReturnValue(2001);
    expect(instance.method(5)).toBe(10);

    await vi.runAllTimersAsync();
    expect(instance.callCount).toBe(2);

    mockTime.mockReturnValue(3001);
    expect(instance.method(5)).toBe(10);
    expect(instance.callCount).toBe(2);
  });
});

describe('CacheReturnValue with async/Promise returns', () => {
  let mockTime: ReturnType<typeof vi.fn<() => number>>;

  beforeEach(() => {
    vi.useFakeTimers();
    mockTime = vi.fn(() => Date.now());
    vi.spyOn(Date, 'now').mockImplementation(mockTime);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('caches resolved Promise return values', async () => {
    class TestClass {
      callCount = 0;

      @CacheReturnValue()
      get value() {
        this.callCount++;
        return Promise.resolve(this.callCount);
      }
    }

    mockTime.mockReturnValue(1000);
    const instance = new TestClass();
    const promise = instance.value;
    expect(instance.callCount).toBe(1);
    expect(await promise).toBe(1);

    mockTime.mockReturnValue(2000);
    const promise2 = instance.value;
    expect(instance.callCount).toBe(1);
    expect(await promise2).toBe(1);
  });

  it('handles async method with arguments', async () => {
    class TestClass {
      callCount = 0;

      @CacheReturnValue()
      async method(x: number) {
        this.callCount++;
        return x * 2;
      }
    }

    mockTime.mockReturnValue(1000);
    const instance = new TestClass();
    expect(await instance.method(5)).toBe(10);
    expect(instance.callCount).toBe(1);

    mockTime.mockReturnValue(2000);
    expect(await instance.method(5)).toBe(10);
    expect(instance.callCount).toBe(1);

    expect(await instance.method(3)).toBe(6);
    expect(instance.callCount).toBe(2);
  });
});

describe('CacheReturnValue edge cases', () => {
  it('handles method with no arguments', () => {
    class TestClass {
      callCount = 0;

      @CacheReturnValue()
      method() {
        this.callCount++;
        return 42;
      }
    }

    const instance = new TestClass();
    expect(instance.method()).toBe(42);
    expect(instance.method()).toBe(42);
    expect(instance.callCount).toBe(1);
  });

  it('handles getter returning null', () => {
    class TestClass {
      callCount = 0;

      @CacheReturnValue()
      get value() {
        this.callCount++;
        return null;
      }
    }

    const instance = new TestClass();
    expect(instance.value).toBe(null);
    expect(instance.value).toBe(null);
    expect(instance.callCount).toBe(1);
  });

  it('handles method returning null', () => {
    class TestClass {
      callCount = 0;

      @CacheReturnValue()
      method() {
        this.callCount++;
        return null;
      }
    }

    const instance = new TestClass();
    expect(instance.method()).toBe(null);
    expect(instance.method()).toBe(null);
    expect(instance.callCount).toBe(1);
  });

  it('handles getter returning undefined', () => {
    class TestClass {
      callCount = 0;

      @CacheReturnValue()
      get value() {
        this.callCount++;
        return undefined;
      }
    }

    const instance = new TestClass();
    expect(instance.value).toBe(undefined);
    expect(instance.value).toBe(undefined);
    expect(instance.callCount).toBe(1);
  });

  it('handles method with multiple arguments including strings', () => {
    class TestClass {
      callCount = 0;

      @CacheReturnValue()
      method(a: number, b: string, c: boolean) {
        this.callCount++;
        return `${a}-${b}-${c}`;
      }
    }

    const instance = new TestClass();
    expect(instance.method(1, 'hello', true)).toBe('1-hello-true');
    expect(instance.method(1, 'hello', true)).toBe('1-hello-true');
    expect(instance.callCount).toBe(1);

    expect(instance.method(2, 'world', false)).toBe('2-world-false');
    expect(instance.callCount).toBe(2);
  });

  it('handles concurrent calls during initial cache miss (method)', async () => {
    class TestClass {
      callCount = 0;

      @CacheReturnValue()
      method(x: number) {
        this.callCount++;
        return x * 2;
      }
    }

    const instance = new TestClass();

    const p1 = instance.method(5);
    const p2 = instance.method(5);
    const p3 = instance.method(5);

    expect(instance.callCount).toBe(1);
    expect(p1).toBe(10);
    expect(p2).toBe(10);
    expect(p3).toBe(10);
  });
});
