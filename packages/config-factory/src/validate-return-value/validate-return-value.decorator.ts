import Joi from 'joi';

/**
 * Decorator that validates the return value of a getter or method with a Joi schema.
 * Throws ValidateReturnValueError if validation fails.
 *
 * @template T - The expected type of the return value.
 * @param schema - Joi schema used to validate the return value.
 *
 * @example
 * class ConfigService {
 *   @ValidateReturnValue(Joi.object({ port: Joi.number() }))
 *   get config() {
 *     return { port: 3000 };
 *   }
 * }
 */
export function ValidateReturnValue<T>(schema: Joi.Schema<T>) {
  return function (target: any, propertyKey: string, descriptor?: PropertyDescriptor) {
    // Getter
    if (descriptor?.get) {
      const originalGet = descriptor.get;
      descriptor.get = function () {
        const value = originalGet.call(this);
        const { error, value: validated } = schema.validate(value, {
          abortEarly: false,
        });
        if (!error) return validated as T;
        throw new ValidateReturnValueError(`Schema violation`, error.details);
      };
      return;
    }

    // Method
    if (descriptor?.value instanceof Function) {
      const originalMethod = descriptor.value;
      descriptor.value = function (...args: any[]) {
        const result = originalMethod.apply(this, args);
        const { error, value: validated } = schema.validate(result, {
          abortEarly: false,
        });
        if (!error) return validated as T;
        throw new ValidateReturnValueError(`Schema violation`, error.details);
      };
      return;
    }

    // If neither getter nor function, fallback using defineProperty
    const privateKey = Symbol(propertyKey);
    Object.defineProperty(target, propertyKey, {
      configurable: true,
      enumerable: true,
      get: function () {
        const value = (this as any)[privateKey];
        const { error, value: validated } = schema.validate(value, {
          abortEarly: false,
        });
        if (!error) return validated as T;
        throw new ValidateReturnValueError(`Schema violation`, error.details);
      },
    });
  };
}

/**
 * Error thrown when a return value fails Joi schema validation.\
 * Extends Error with Joi validation details as the cause.
 */
export class ValidateReturnValueError extends Error {
  constructor(message?: string, cause?: unknown) {
    super(message, { cause });
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
