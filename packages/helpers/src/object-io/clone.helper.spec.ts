import { clone } from './clone.helper.ts';

describe('clone', () => {
  test('clones a simple object', () => {
    const original = { a: 1, b: 2 };
    const copied = clone(original);
    expect(copied).toEqual(original);
    expect(copied).not.toBe(original);
  });

  test('clones a nested object', () => {
    const original = { a: { b: { c: 3 } } };
    const copied = clone(original);
    expect(copied).toEqual(original);
    expect(copied).not.toBe(original);
    expect(copied.a).not.toBe(original.a);
  });

  test('clones an array', () => {
    const original = [1, 2, { a: 3 }];
    const copied = clone(original);
    expect(copied).toEqual(original);
    expect(copied).not.toBe(original);
    expect(copied[2]).not.toBe(original[2]);
  });

  test('clones empty objects and arrays', () => {
    expect(clone({})).toEqual({});
    expect(clone([])).toEqual([]);
  });

  test('clones object with array property', () => {
    const original = { arr: [1, 2, 3] };
    const copied = clone(original);
    expect(copied).toEqual(original);
    expect(copied.arr).not.toBe(original.arr);
  });

  test('modifying original does not affect clone', () => {
    const original = { a: { b: 1 }, c: [1, 2] };
    const copied = clone(original);
    original.a.b = 99;
    original.c.push(3);
    expect(copied).toEqual({ a: { b: 1 }, c: [1, 2] });
  });

  test('cloning null, numbers, strings', () => {
    expect(clone(null)).toBeNull();
    expect(clone(42)).toBe(42);
    expect(clone('foo')).toBe('foo');
  });

  test('cloning boolean values', () => {
    expect(clone(true)).toBe(true);
    expect(clone(false)).toBe(false);
  });
});
