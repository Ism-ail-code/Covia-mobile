/**
 * Image compression for verification documents.
 *
 * Camera photos are often 3–10 MB; the storage service caps uploads at
 * 10 MB. Compressing down to ~1–2 MB makes uploads fast and reliable
 * without losing OCR-grade readability.
 */

import * as ImageManipulator from "expo-image-manipulator";
import { File } from "expo-file-system";
import type { DocumentSource } from "./verification";

/** Files at or below this size are uploaded as-is. */
const COMPRESS_THRESHOLD_BYTES = 2.5 * 1024 * 1024;
/** Long edge limit for resized documents. */
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.72;

export function shouldCompress(source: DocumentSource): boolean {
  return (source.fileSize ?? 0) > COMPRESS_THRESHOLD_BYTES;
}

/** Resize + re-encode large documents; returns the input untouched otherwise. */
export async function maybeCompressDocument(
  source: DocumentSource,
): Promise<DocumentSource> {
  if (!shouldCompress(source)) return source;
  const result = await ImageManipulator.manipulateAsync(
    source.uri,
    [{ resize: { width: MAX_DIMENSION } }],
    { compress: JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG },
  );
  const size = new File(result.uri).size;
  return {
    uri: result.uri,
    mimeType: "image/jpeg",
    fileName: source.fileName ?? "document.jpg",
    fileSize: size,
  };
}
