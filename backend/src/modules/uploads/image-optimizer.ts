// image-optimizer.ts -- shrinks every uploaded photo before it is stored.
//
// Phone and camera photos are often 3 to 5 MB. Visitors would download all of that to see a
// small card, so uploads are resized and re-encoded here instead:
//   - the longest side is limited to MAX_DIMENSION (never enlarged)
//   - saved as WebP (about 70 to 90 percent smaller than PNG, and keeps transparency)
//   - the EXIF orientation is applied, then ALL metadata is dropped, which also removes the
//     GPS location a phone embeds in its photos
// If the bytes cannot be decoded as an image, this throws, so a corrupt or disguised file is rejected.
import sharp from 'sharp';

export const MAX_DIMENSION = 1920; // wide enough for a full-width hero on a large screen
export const WEBP_QUALITY = 82;
// Refuse absurdly large pixel counts (a small file can decompress to gigabytes).
const MAX_INPUT_PIXELS = 40_000_000;

export interface OptimizedImage {
  buffer: Buffer;
  extension: 'webp';
}

export async function optimizeImage(input: Buffer): Promise<OptimizedImage> {
  const buffer = await sharp(input, { failOn: 'error', limitInputPixels: MAX_INPUT_PIXELS })
    .rotate()
    .resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toBuffer();
  return { buffer, extension: 'webp' };
}
