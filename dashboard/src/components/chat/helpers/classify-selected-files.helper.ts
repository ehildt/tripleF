import type { UploadedImage } from '@/stores/conversation';
import { hashFile } from '@/utils/hash-file.helper';

export interface ClassifiedSelectedFiles {
  newFiles: File[];
  referencedImages: UploadedImage[];
}

/**
 * Split the toolbar's selected files into the ones the server has not seen
 * yet (`newFiles`, to be uploaded as form-data attachments) and a
 * `referencedImages` entry for every selected file, which is used to build
 * the conversation metadata of the request. A file is considered already
 * uploaded when an uploaded image with the same SHA-256 hash exists for the
 * active conversation.
 */
export async function classifySelectedFiles(
  files: File[],
  uploadedImages: UploadedImage[],
  conversationId: string,
): Promise<ClassifiedSelectedFiles> {
  const uploadedHashes = new Set(
    uploadedImages
      .filter((img) => img.conversationId === conversationId)
      .map((img) => img.hash),
  );
  const fileHashes = await Promise.all(files.map((file) => hashFile(file)));

  const referencedImages: UploadedImage[] = [];
  const newFiles: File[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const hash = fileHashes[i];
    referencedImages.push({
      name: file.name,
      hash,
      size: file.size,
      uploadedAt: Date.now(),
      conversationId,
    });
    if (!uploadedHashes.has(hash)) {
      newFiles.push(file);
    }
  }

  return { newFiles, referencedImages };
}
