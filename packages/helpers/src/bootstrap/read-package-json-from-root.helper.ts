import * as fs from 'fs';

import { findUp } from '../find-up/index.ts';

interface PackageConfig {
  name: string;
  version: string;
  description: string;
}

export function readPackageJsonFromRoot(
  filename: string = 'package.json',
  startDir: string = process.cwd(),
): PackageConfig {
  const packageJsonPath = findUp(filename, startDir);
  if (!packageJsonPath) throw Error(`File ${filename} not found`);
  const fileContent = fs.readFileSync(packageJsonPath, 'utf8');
  return JSON.parse(fileContent) as PackageConfig;
}
