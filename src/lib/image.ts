/**
 * Covia Image Utilities — image manipulation helpers.
 * Provides resize, compress, and format conversion utilities.
 */

export type ImageSize = {
  width: number;
  height: number;
};

export type ResizeOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1
};

/** Calculate the target dimensions maintaining aspect ratio. */
export function calculateAspectRatio(
  source: ImageSize,
  max: { width: number; height: number },
): ImageSize {
  const { width: sw, height: sh } = source;
  const { width: mw, height: mh } = max;

  if (sw <= mw && sh <= mh) {
    return { width: sw, height: sh };
  }

  const ratio = Math.min(mw / sw, mh / sh);
  return {
    width: Math.round(sw * ratio),
    height: Math.round(sh * ratio),
  };
}

/** Validate that an image file size is within limits. */
export function isImageSizeValid(fileSizeBytes: number, maxMB: number = 10): boolean {
  const maxBytes = maxMB * 1024 * 1024;
  return fileSizeBytes <= maxBytes;
}

/** Get the file extension from a URI. */
export function getImageExtension(uri: string): string {
  const match = uri.match(/\.(\w+)(?:\?.*)?$/);
  return match ? match[1].toLowerCase() : "jpg";
}

/** Check if a file URI is an image based on extension. */
export function isImageUri(uri: string): boolean {
  const ext = getImageExtension(uri);
  return ["jpg", "jpeg", "png", "gif", "webp", "heic"].includes(ext);
}

/** Generate a unique filename for an image upload. */
export function generateImageFilename(prefix: string = "img"): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${timestamp}_${random}.jpg`;
}
