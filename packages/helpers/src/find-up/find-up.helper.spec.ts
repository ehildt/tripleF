import fs from 'fs';
import path from 'path';

import { findUp } from './find-up.helper.ts';

describe('findUp', () => {
  const testDir = '/tmp/findUp-test';

  beforeEach(() => {
    if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true });
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true });
  });

  test('finds file in current directory', () => {
    const testFile = path.join(testDir, 'test.txt');
    fs.writeFileSync(testFile, 'content');

    const result = findUp('test.txt', testDir);
    expect(result).toBe(testFile);
  });

  test('finds file in parent directory', () => {
    const parentDir = path.join(testDir, 'parent');
    const childDir = path.join(parentDir, 'child');
    fs.mkdirSync(childDir, { recursive: true });

    const testFile = path.join(parentDir, 'test.txt');
    fs.writeFileSync(testFile, 'content');

    const result = findUp('test.txt', childDir);
    expect(result).toBe(testFile);
  });

  test('finds file in ancestor directory', () => {
    const level1 = path.join(testDir, 'level1');
    const level2 = path.join(level1, 'level2');
    const level3 = path.join(level2, 'level3');
    fs.mkdirSync(level3, { recursive: true });

    const testFile = path.join(testDir, 'test.txt');
    fs.writeFileSync(testFile, 'content');

    const result = findUp('test.txt', level3);
    expect(result).toBe(testFile);
  });

  test('returns null when file not found', () => {
    const result = findUp('nonexistent.txt', testDir);
    expect(result).toBeNull();
  });

  test('returns null when file not found up to root', () => {
    const deepDir = path.join(testDir, 'a', 'b', 'c', 'd');
    fs.mkdirSync(deepDir, { recursive: true });

    const result = findUp('nonexistent.txt', deepDir);
    expect(result).toBeNull();
  });

  test('uses process.cwd() as default startDir', () => {
    const originalCwd = process.cwd();
    process.chdir(testDir);

    const testFile = path.join(testDir, 'test.txt');
    fs.writeFileSync(testFile, 'content');

    try {
      const result = findUp('test.txt');
      expect(result).toBe(testFile);
    } finally {
      process.chdir(originalCwd);
    }
  });

  test('finds file with custom filename', () => {
    const customFile = path.join(testDir, 'custom.config.json');
    fs.writeFileSync(customFile, '{}');

    const result = findUp('custom.config.json', testDir);
    expect(result).toBe(customFile);
  });

  test('returns first match when multiple files exist', () => {
    const parentDir = path.join(testDir, 'parent');
    const childDir = path.join(parentDir, 'child');
    fs.mkdirSync(childDir, { recursive: true });

    const parentFile = path.join(parentDir, 'test.txt');
    const childFile = path.join(childDir, 'test.txt');
    fs.writeFileSync(parentFile, 'parent');
    fs.writeFileSync(childFile, 'child');

    const result = findUp('test.txt', childDir);
    expect(result).toBe(childFile);
  });
});
