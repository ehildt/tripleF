import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Reads the app version from the closest `package.json`.
 *
 * Looked up from the dashboard root outward: the monorepo places a
 * top-level `package.json` one level above the dashboard. Falls back
 * to the dashboard's own `package.json`, and finally to `0.0.0` if no
 * readable file is found.
 */
export function readAppVersion(): string {
  const files = [
    path.resolve(__dirname, '../package.json'),
    path.resolve(__dirname, './package.json'),
  ];
  for (const f of files) {
    try {
      return JSON.parse(readFileSync(f, 'utf-8')).version;
    } catch {
      /* not found */
    }
  }
  return '0.0.0';
}
