/** Project a file into the saved-file-info shape. */
export function mapFileToSavedInfo(f: File) {
  return { name: f.name, size: f.size, type: f.type };
}
