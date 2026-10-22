import type { z } from 'zod';

/**
 * Decorator that validates the return value of a getter or method with a Zod schema.
 * Throws ValidateReturnValueError if validation fails.
 *
 * @template T - The expected type of the return value.
 * @param schema - Zod schema used to validate the return value.
 *
 * @example
 * class ConfigService {
 *   @ValidateReturnValue(z.object({ port: z.number() }))
 *   get config() {
 *     return { port: 3000 };
 *   }
 * }
 */
export function ValidateReturnValue<T>(schema: z.ZodType<T>) {
  return function (target: any, propertyKey: string, descriptor?: PropertyDescriptor) {
    // Getter
    if (descriptor?.get) {
      const originalGet = descriptor.get;
      descriptor.get = function () {
        const value = originalGet.call(this);
        const result = schema.safeParse(value);
        if (result.success) return result.data;
        throw new ValidateReturnValueError(`Schema violation`, result.error.issues);
      };
      return;
    }

    // Method
    if (descriptor?.value instanceof Function) {
      const originalMethod = descriptor.value;
      descriptor.value = function (...args: any[]) {
        const result = originalMethod.apply(this, args);
        const parsed = schema.safeParse(result);
        if (parsed.success) return parsed.data;
        throw new ValidateReturnValueError(`Schema violation`, parsed.error.issues);
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
        const result = schema.safeParse(value);
        if (result.success) return result.data;
        throw new ValidateReturnValueError(`Schema violation`, result.error.issues);
      },
    });
  };
}

/**
 * Error thrown when a return value fails Zod schema validation.\
 * Extends Error with the Zod issues as the cause.
 */
export class ValidateReturnValueError extends Error {
  constructor(message?: string, cause?: unknown) {
    super(message, { cause });
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
