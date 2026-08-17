/**
 * Shrink phone camera photos before upload so they stay under API/nginx limits.
 * Also converts HEIC/PNG/WebP to JPEG when the browser can decode them.
 */
export async function compressImage(file, { maxDim = 1600, quality = 0.82 } = {}) {
  if (!(file instanceof Blob) || !file.type.startsWith('image/')) return file;
  if (file.size < 400 * 1024 && file.type === 'image/jpeg') return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', quality);
    });
    if (!blob || blob.size >= file.size) return file;

    const name = (file.name || 'product.jpg').replace(/\.[^.]+$/, '.jpg');
    return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() });
  } catch {
    return file;
  }
}

export async function compressImages(files) {
  const list = Array.from(files || []);
  const compressed = [];
  for (const file of list) {
    compressed.push(await compressImage(file));
  }
  return compressed;
}
