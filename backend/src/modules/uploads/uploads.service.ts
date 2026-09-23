// uploads.service.ts — validates an uploaded image and saves it to disk.
// Files are served back publicly from /files/<name> (see main.ts).
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { mkdir, writeFile, unlink } from 'fs/promises';
import { join, basename } from 'path';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB, same limit as the frontend form

// The shape of the file multer hands us (kept local so no @types/multer is needed).
export interface UploadedImage {
  buffer: Buffer;
  size: number;
  mimetype: string;
  originalname: string;
}

// Read at call time (not import time) so values from .env are already loaded.
export function getUploadDir() {
  return process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');
}

function publicBaseUrl() {
  return (process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`).replace(/\/$/, '');
}

// Never trust the filename or the Content-Type the browser sent — look at the
// file's first bytes to see what it really is. Returns the safe extension to store.
function detectImageExtension(buf: Buffer): 'jpg' | 'png' | 'webp' | null {
  if (buf.length < 12) return null;

  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';

  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (png.every((byte, i) => buf[i] === byte)) return 'png';

  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp';

  return null;
}

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  async saveImage(file?: UploadedImage) {
    if (!file?.buffer) {
      throw new BadRequestException('No file received. Send it as multipart form data in a field named "file".');
    }

    const extension = detectImageExtension(file.buffer);
    if (!extension) {
      throw new BadRequestException('Only JPG, PNG or WebP images are allowed.');
    }

    const dir = getUploadDir();
    await mkdir(dir, { recursive: true });

    // Random name: no collisions, and nothing the user typed ends up in the path.
    const name = `${randomBytes(16).toString('hex')}.${extension}`;
    await writeFile(
      join(dir, name),
      new Uint8Array(file.buffer),
    );

    return { url: `${publicBaseUrl()}/files/${name}` };
  }

  // Deletes a file previously returned by saveImage(). Silently does nothing
  // for anything that isn't one of our own /files/<name> URLs (external
  // image URLs, seed/demo data, null/undefined) — never throws, since a
  // failed cleanup shouldn't block the delete of the record that owned it.
  async deleteFile(url?: string | null): Promise<void> {
    if (!url || !url.includes('/files/')) return;

    const name = basename(url.split('/files/')[1] ?? '');
    if (!name || name.includes('..')) return; // guards against a malformed/hostile path

    try {
      await unlink(join(getUploadDir(), name));
    } catch (error) {
      // ENOENT (already gone) is fine and expected; anything else is worth a log.
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.logger.warn(`Failed to delete upload "${name}": ${(error as Error).message}`);
      }
    }
  }
}