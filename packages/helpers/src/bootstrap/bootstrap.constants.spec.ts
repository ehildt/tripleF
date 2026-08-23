import type { LogLevel } from '@nestjs/common';

import {
  API_DOCS,
  API_DOCS_JSON,
  DEFAULT_BODY_LIMIT,
  DEFAULT_LOG_LEVELS,
  getBodyLimit,
  getLogLevel,
} from './bootstrap.constants.ts';

describe('bootstrap constants', () => {
  describe('API_DOCS', () => {
    test("should be 'api-docs'", () => {
      expect(API_DOCS).toBe('api-docs');
    });
  });

  describe('API_DOCS_JSON', () => {
    test("should be 'api-docs-json'", () => {
      expect(API_DOCS_JSON).toBe('api-docs-json');
    });
  });

  describe('DEFAULT_BODY_LIMIT', () => {
    test('should be 16777216 (16MB)', () => {
      expect(DEFAULT_BODY_LIMIT).toBe(16777216);
    });
  });

  describe('DEFAULT_LOG_LEVELS', () => {
    test('should contain all log levels', () => {
      expect(DEFAULT_LOG_LEVELS).toEqual(['warn', 'error', 'debug', 'log', 'verbose', 'fatal']);
    });

    test('should be array of LogLevel type', () => {
      const levels: Array<LogLevel> = DEFAULT_LOG_LEVELS;
      expect(levels).toBeInstanceOf(Array);
    });
  });

  describe('getBodyLimit', () => {
    test('should return parsed integer from string', () => {
      expect(getBodyLimit('1000000')).toBe(1000000);
    });

    test('should return DEFAULT_BODY_LIMIT when value is null', () => {
      expect(getBodyLimit(null)).toBe(DEFAULT_BODY_LIMIT);
    });

    test('should return DEFAULT_BODY_LIMIT when value is undefined', () => {
      expect(getBodyLimit(undefined)).toBe(DEFAULT_BODY_LIMIT);
    });

    test('should return DEFAULT_BODY_LIMIT for invalid string', () => {
      expect(getBodyLimit('not-a-number')).toBe(DEFAULT_BODY_LIMIT);
    });

    test('should return parsed value for valid numeric string', () => {
      expect(getBodyLimit('5242880')).toBe(5242880);
    });
  });

  describe('getLogLevel', () => {
    test('should return DEFAULT_LOG_LEVELS when value is undefined', () => {
      expect(getLogLevel(undefined)).toEqual(DEFAULT_LOG_LEVELS);
    });

    test('should return DEFAULT_LOG_LEVELS when value is empty string', () => {
      expect(getLogLevel('')).toEqual(DEFAULT_LOG_LEVELS);
    });

    test('should parse comma-separated log levels', () => {
      expect(getLogLevel('error,warn,log')).toEqual(['error', 'warn', 'log']);
    });

    test('should filter out empty strings', () => {
      expect(getLogLevel('error,,warn,,log')).toEqual(['error', 'warn', 'log']);
    });

    test('should return single level', () => {
      expect(getLogLevel('error')).toEqual(['error']);
    });

    test('should handle all log levels', () => {
      expect(getLogLevel('warn,error,debug,log,verbose,fatal')).toEqual(DEFAULT_LOG_LEVELS);
    });
  });
});
