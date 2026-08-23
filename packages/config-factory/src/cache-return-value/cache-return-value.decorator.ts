import { hashPayload } from '@triplef/helpers/hash-payload';
import Joi from 'joi';

import { ValidateReturnValueError } from '../validate-return-value/validate-return-value.decorator.ts';

const DEFAULT_TTL_MS = 5 * 60 * 1000;

export interface CacheConfig<T = unknown> {
  /**
   * Optional Joi schema to validate the return value.
   */
  schema?: Joi.Schema<T>;
  /**
   * Time-to-live in milliseconds for the cached value.
   * - `number`: Cache expires after the specified milliseconds
   * - `false`: Cache never expires (permanent)
   * - `undefined` (default): Uses 5 minutes (300000ms)
   */
  ttl?: number | false;
}

type CacheEntry<T> = {
  value: T;
  timestamp: number;
  refreshPromise?: Promise<T>;
};

function isJoiSchema(value: unknown): value is Joi.Schema {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    typeof (value as Record<string, unknown>).validate === 'function'
  );
}

function parseConfig<T>(config: Joi.Schema<T> | CacheConfig<T> | false | number | undefined): {
  schema?: Joi.Schema<T>;
  ttl: number | false;
} {
  if (config === false) return { ttl: false };
  if (config === undefined) return { ttl: DEFAULT_TTL_MS };
  if (typeof config === 'number') return { ttl: config };
  if (isJoiSchema(config)) return { schema: config, ttl: DEFAULT_TTL_MS };
  return {
    schema: config.schema,
    ttl: config.ttl ?? DEFAULT_TTL_MS,
  };
}

function validateValue<T>(value: unknown, schema?: Joi.Schema<T>): T {
  if (schema) {
    const { error, value: validated } = schema.validate(value, {
      abortEarly: false,
    });
    if (error) throw new ValidateReturnValueError(`Schema violation`, error.details);
    return validated;
  }
  return value as T;
}

function isExpired(entry: CacheEntry<unknown>, ttl: number | false): boolean {
  if (ttl === false) return false;
  return Date.now() - entry.timestamp > ttl;
}

/**
 * Decorator that caches the return value of a method or a getter property.\
 * Optionally validates the cached value against a Joi schema and supports TTL-based expiration.
 *
 * Uses stale-while-revalidate strategy: returns stale value immediately while refreshing in background.
 *
 * @template T - The expected type of the return value.
 * @param config - Configuration options:
 *   - `Joi.Schema<T>`: Validate return value with schema, use default 5min TTL
 *   - `CacheConfig<T>`: Object with optional `schema` and `ttl` properties
 *   - `number`: TTL in milliseconds, no validation
 *   - `false`: Permanent cache (no expiration)
 *   - `undefined`: Use default 5min TTL, no validation
 *
 * @example
 * // Default 5 minute TTL
 * @CacheReturnValue()
 *
 * @example
 * // With schema validation and default TTL
 * @CacheReturnValue(Joi.object({ id: Joi.number() }))
 *
 * @example
 * // Number as TTL shorthand (60 seconds)
 * @CacheReturnValue(60000)
 *
 * @example
 * // Custom TTL with config object (60 seconds)
 * @CacheReturnValue({ ttl: 60000 })
 *
 * @example
 * // Permanent cache with validation
 * @CacheReturnValue({ schema: Joi.number(), ttl: false })
 */
export function CacheReturnValue<T = unknown>(
  config?: Joi.Schema<T> | CacheConfig<T> | false | number,
): MethodDecorator & PropertyDecorator {
  return function (_target: any, propertyKey: string | symbol, descriptor?: PropertyDescriptor): void {
    const { schema, ttl } = parseConfig(config);
    const setCache = (instance: object, key: string, value: unknown, refreshPromise?: Promise<unknown>): void => {
      let instanceCache = INSTANCE_CACHE.get(instance);
      if (!instanceCache) {
        instanceCache = new Map<string, CacheEntry<unknown>>();
        INSTANCE_CACHE.set(instance, instanceCache);
      }
      instanceCache.set(key, { value, timestamp: Date.now(), refreshPromise } as CacheEntry<unknown>);
    };

    if (descriptor?.get) {
      const originalGet = descriptor.get;
      descriptor.get = function (): unknown {
        const cache = getCacheFor(this);
        const key = String(propertyKey);
        const entry = cache.get(key) as CacheEntry<unknown> | undefined;

        if (!entry) {
          const value = validateValue(originalGet.call(this), schema);
          setCache(this, key, value);
          return value;
        }

        if (!isExpired(entry, ttl)) return entry.value;

        const staleValue = entry.value;

        if (entry.refreshPromise) return staleValue;

        const refreshPromise = (async () => {
          return validateValue(await originalGet.call(this), schema);
        })();

        setCache(this, key, staleValue, refreshPromise);

        refreshPromise
          .then((freshValue) => {
            setCache(this, key, freshValue);
          })
          .catch(() => {
            setCache(this, key, staleValue);
          });

        return staleValue;
      };
    }

    if (descriptor?.value instanceof Function) {
      const originalMethod = descriptor.value;
      descriptor.value = function (...args: unknown[]): unknown {
        const cache = getCacheFor(this);
        const key = hashPayload(`${String(propertyKey)}:${JSON.stringify(args)}`);
        const entry = cache.get(key) as CacheEntry<unknown> | undefined;

        if (!entry) {
          const result = validateValue(originalMethod.apply(this, args), schema);
          setCache(this, key, result);
          return result;
        }

        if (!isExpired(entry, ttl)) return entry.value;

        const staleValue = entry.value;

        if (entry.refreshPromise) return staleValue;

        const refreshPromise = (async () => {
          return validateValue(await originalMethod.apply(this, args), schema);
        })();

        setCache(this, key, staleValue, refreshPromise);

        refreshPromise
          .then((freshValue) => {
            setCache(this, key, freshValue);
          })
          .catch(() => {
            setCache(this, key, staleValue);
          });

        return staleValue;
      };
    }
  };
}

const INSTANCE_CACHE: WeakMap<object, Map<string, CacheEntry<unknown>>> = new WeakMap();
function getCacheFor(instance: object): Map<string, CacheEntry<unknown>> {
  let cache = INSTANCE_CACHE.get(instance);
  if (!cache) {
    cache = new Map<string, CacheEntry<unknown>>();
    INSTANCE_CACHE.set(instance, cache);
  }
  return cache;
}
