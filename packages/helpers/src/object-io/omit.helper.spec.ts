import { omit } from './omit.helper.ts';

describe('omit function', () => {
  test('should omit a single key from an object', () => {
    const user = { name: 'Alice', age: 30, city: 'Paris' };
    const result = omit(user, ['age']);
    expect(result).toEqual({ name: 'Alice', city: 'Paris' });
  });

  test('should omit multiple keys from an object', () => {
    const user = { name: 'Alice', age: 30, city: 'Paris', country: 'France' };
    const result = omit(user, ['age', 'city']);
    expect(result).toEqual({ name: 'Alice', country: 'France' });
  });

  test('should return the same object if no keys match', () => {
    const user = { name: 'Alice', age: 30 };
    const result = omit(user, ['city' as 'name']);
    expect(result).toEqual(user);
  });

  test('should return an empty object if all keys are omitted', () => {
    const user = { name: 'Alice', age: 30 };
    const result = omit(user, ['name', 'age']);
    expect(result).toEqual({});
  });

  test('should work with objects with optional or undefined values', () => {
    const user: { name?: string; age?: number } = {
      name: 'Alice',
      age: undefined,
    };
    const result = omit(user, ['age']);
    expect(result).toEqual({ name: 'Alice' });
  });

  test('should not modify the original object', () => {
    const user = { name: 'Alice', age: 30 };
    const copy = { ...user };
    omit(user, ['age']);
    expect(user).toEqual(copy);
  });

  test('should work with numeric keys as strings', () => {
    const obj = { '1': 'a', '2': 'b', '3': 'c' };
    const result = omit(obj, ['2']);
    expect(result).toEqual({ '1': 'a', '3': 'c' });
  });
});
