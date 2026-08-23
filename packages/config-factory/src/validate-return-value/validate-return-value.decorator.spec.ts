import Joi from 'joi';

import { ValidateReturnValue, ValidateReturnValueError } from './validate-return-value.decorator.ts';

class TestClass {
  private _value = 0;

  @ValidateReturnValue(Joi.number().min(1))
  get validatedGetter() {
    return this._value;
  }

  set validatedGetter(val: number) {
    this._value = val;
  }

  @ValidateReturnValue(Joi.object({ id: Joi.number().required(), name: Joi.string().required() }))
  getUser(id: number) {
    return { id, name: 'John' };
  }

  @ValidateReturnValue(Joi.number().min(10).max(100))
  validateNumber(value: number) {
    return value;
  }
}

describe('ValidateReturnValue decorator', () => {
  let instance: TestClass;

  beforeEach(() => {
    instance = new TestClass();
  });

  describe('getter validation', () => {
    it('allows valid getter return values', () => {
      instance.validatedGetter = 5;
      expect(instance.validatedGetter).toBe(5);
    });

    it('throws ValidateReturnValueError on invalid getter return', () => {
      instance.validatedGetter = 0;
      expect(() => instance.validatedGetter).toThrow(ValidateReturnValueError);
      expect(() => instance.validatedGetter).toThrow(/Schema violation/);
    });
  });

  describe('method validation', () => {
    it('allows valid method return values', () => {
      const result = instance.getUser(1);
      expect(result).toEqual({ id: 1, name: 'John' });
    });

    it('throws ValidateReturnValueError on invalid method return', () => {
      expect(() => instance.getUser('invalid' as any)).toThrow(ValidateReturnValueError);
      expect(() => instance.getUser('invalid' as any)).toThrow(/Schema violation/);
    });

    it('handles Joi transformations', () => {
      const result = instance.validateNumber(50);
      expect(result).toBe(50);
    });

    it('rejects values outside Joi schema range', () => {
      expect(() => instance.validateNumber(5)).toThrow(/Schema violation/);
      expect(() => instance.validateNumber(150)).toThrow(/Schema violation/);
    });
  });
});

describe('ValidateReturnValueError', () => {
  it('has correct name', () => {
    const error = new ValidateReturnValueError('Test error');
    expect(error.name).toBe('ValidateReturnValueError');
  });

  it('has correct message', () => {
    const error = new ValidateReturnValueError('Schema violation');
    expect(error.message).toBe('Schema violation');
  });

  it('has cause property with validation details', () => {
    const details = [{ message: 'invalid' }];
    const error = new ValidateReturnValueError('Schema violation', details);
    expect(error.cause).toEqual(details);
  });

  it('is instance of Error', () => {
    const error = new ValidateReturnValueError();
    expect(error instanceof Error).toBe(true);
  });

  it('can be caught with Error handler', () => {
    let caughtError: unknown;
    try {
      throw new ValidateReturnValueError('Test', [{ message: 'test' }]);
    } catch (e) {
      caughtError = e;
    }
    expect(caughtError).toBeInstanceOf(ValidateReturnValueError);
  });
});
