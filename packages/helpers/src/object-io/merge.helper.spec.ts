import { merge } from './merge.helper.ts';

describe('merge', () => {
  test('merges two objects shallowly by default', () => {
    const a = { a: 1, b: { x: 10 } };
    const b = { b: { y: 20 }, c: 3 };
    expect(merge(a, b)).toEqual({ a: 1, b: { y: 20 }, c: 3 });
  });

  test('merges two objects deeply when deep=true', () => {
    const a = { a: 1, b: { x: 10 } };
    const b = { b: { y: 20 }, c: 3 };
    expect(merge(a, b, true)).toEqual({ a: 1, b: { x: 10, y: 20 }, c: 3 });
  });

  test('overwrites primitive values', () => {
    const a = { a: 1 };
    const b = { a: 2 };
    expect(merge(a, b)).toEqual({ a: 2 });
    expect(merge(a, b, true)).toEqual({ a: 2 });
  });

  test('arrays are overwritten, not merged', () => {
    const a = { arr: [1, 2] };
    const b = { arr: [3, 4] };
    expect(merge(a, b)).toEqual({ arr: [3, 4] });
    expect(merge(a, b, true)).toEqual({ arr: [3, 4] });
  });

  test('deep merge handles multi-level nested objects', () => {
    const a = { a: { b: { c: 1 } } };
    const b = { a: { b: { d: 2 }, e: 3 }, f: 4 };
    expect(merge(a, b, true)).toEqual({
      a: { b: { c: 1, d: 2 }, e: 3 },
      f: 4,
    });
  });

  test('merging with empty objects', () => {
    expect(merge({}, { a: 1 })).toEqual({ a: 1 });
    expect(merge({ a: 1 }, {})).toEqual({ a: 1 });
    expect(merge({}, {}, true)).toEqual({});
  });

  test('does not mutate input objects', () => {
    const a = { a: 1, b: { x: 10 } };
    const b = { b: { y: 20 } };
    merge(a, b, true);
    expect(a).toEqual({ a: 1, b: { x: 10 } });
    expect(b).toEqual({ b: { y: 20 } });
  });

  test('deep merge does not recurse into non-object values', () => {
    const a = { a: { b: 1 } };
    const b = { a: { b: 2 } };
    expect(merge(a, b, true)).toEqual({ a: { b: 2 } });
  });
});
