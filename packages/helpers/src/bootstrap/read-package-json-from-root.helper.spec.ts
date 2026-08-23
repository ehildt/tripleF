import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { readPackageJsonFromRoot } from './read-package-json-from-root.helper.ts';

describe('readPackageJsonFromRoot', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'read-package-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  test('should read and parse package.json', () => {
    const packageJson = {
      name: 'test-package',
      version: '1.0.0',
      description: 'Test package description',
    };

    fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify(packageJson));

    const result = readPackageJsonFromRoot('package.json', tempDir);

    expect(result).toEqual(packageJson);
  });

  test('should throw error when file is not found', () => {
    expect(() => readPackageJsonFromRoot('nonexistent.json', tempDir)).toThrow('File nonexistent.json not found');
  });

  test('should find package.json in parent directory', () => {
    const parentDir = tempDir;
    const childDir = path.join(parentDir, 'child');
    fs.mkdirSync(childDir, { recursive: true });

    const packageJson = {
      name: 'parent-package',
      version: '2.0.0',
      description: 'Parent package',
    };

    fs.writeFileSync(path.join(parentDir, 'package.json'), JSON.stringify(packageJson));

    const result = readPackageJsonFromRoot('package.json', childDir);

    expect(result).toEqual(packageJson);
  });

  test('should use default filename package.json', () => {
    const packageJson = {
      name: 'default-test',
      version: '1.0.0',
      description: 'Default test package',
    };

    fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify(packageJson));

    const result = readPackageJsonFromRoot(undefined as unknown as string, tempDir);

    expect(result).toEqual(packageJson);
  });

  test('should use default startDir (process.cwd())', () => {
    const packageJson = {
      name: 'cwd-test',
      version: '1.0.0',
      description: 'CWD test package',
    };

    fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify(packageJson));

    const originalCwd = process.cwd();
    process.chdir(tempDir);

    try {
      const result = readPackageJsonFromRoot();
      expect(result).toEqual(packageJson);
    } finally {
      process.chdir(originalCwd);
    }
  });

  test('should read custom file', () => {
    const customConfig = {
      name: 'custom-config',
      version: '3.0.0',
      description: 'Custom configuration',
    };

    fs.writeFileSync(path.join(tempDir, 'config.json'), JSON.stringify(customConfig));

    const result = readPackageJsonFromRoot('config.json', tempDir);

    expect(result).toEqual(customConfig);
  });
});
