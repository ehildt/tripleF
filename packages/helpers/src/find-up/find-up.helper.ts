import fs from 'fs';
import path from 'path';

/**
 * Recursively searches for a file by traversing up the directory tree.
 *
 * @param filename - The name of the file to find (e.g., "README.md").
 * @param startDir - The directory to start searching from. Defaults to the current working directory.
 * @returns The absolute path to the found file, or `null` if the file is not found up to the filesystem root.
 *
 * @example
 * const readmePath = findUp("README.md");
 * if (readmePath) {
 *   console.log(`Found README at ${readmePath}`);
 * } else {
 *   console.log("README.md not found");
 * }
 */
export function findUp(filename: string, startDir: string = process.cwd()): string | null {
  let dir = startDir;
  while (true) {
    const candidate = path.join(dir, filename);
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}
