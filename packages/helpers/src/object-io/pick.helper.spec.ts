import { pick } from './pick.helper.ts';

describe('pick', () => {
  test('picks a single field from an object', () => {
    const user = { name: 'Alice', age: 30, city: 'Paris' };
    const result = pick(user, ['age']);
    expect(result).toEqual({ age: 30 });
  });

  test('picks multiple fields from an object', () => {
    const user = { name: 'Alice', age: 30, city: 'Paris' };
    const result = pick(user, ['name', 'city']);
    expect(result).toEqual({ name: 'Alice', city: 'Paris' });
  });

  test('returns an empty object when given an empty key list', () => {
    const user = { name: 'Alice', age: 30 };
    const result = pick(user, []);
    expect(result).toEqual({});
  });

  test('returns all fields when all keys are provided', () => {
    const user = { name: 'Alice', age: 30 };
    const result = pick(user, ['name', 'age']);
    expect(result).toEqual({ name: 'Alice', age: 30 });
  });

  test('does not modify the original object', () => {
    const user = { name: 'Alice', age: 30 };
    const original = { ...user };
    pick(user, ['age']);
    expect(user).toEqual(original);
  });

  test('includes keys with undefined values', () => {
    const user: { name?: string; age?: number } = {
      name: 'Alice',
      age: undefined,
    };

    const result = pick(user, ['name', 'age']);
    expect(result).toEqual({ name: 'Alice', age: undefined });
  });

  test('ignores keys that are not present at runtime', () => {
    const user = { name: 'Alice' };
    const result = pick(user, ['name']);
    expect(result).toEqual({ name: 'Alice' });
  });

  test('ignores keys not in the object', () => {
    const user = { name: 'Alice' };
    const result = pick(user, ['name', 'nonexistent']);
    expect(result).toEqual({ name: 'Alice' });
  });

  test('handles symbol keys', () => {
    const sym = Symbol('test');
    const obj = { [sym]: 'value', name: 'Alice' };
    const result = pick(obj, [sym as keyof typeof obj]);
    expect(result).toEqual({ [sym]: 'value' });
  });
});
