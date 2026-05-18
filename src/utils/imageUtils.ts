/** Compresse une image en WebP (max 800px, qualité 75%) */
export async function compressImage(source: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(source);
    const img = new Image();

    img.onload = () => {
      const MAX = 800;
      let w = img.naturalWidth;
      let h = img.naturalHeight;

      if (w > MAX) {
        h = Math.round((h * MAX) / w);
        w = MAX;
      }
      if (h > MAX) {
        w = Math.round((w * MAX) / h);
        h = MAX;
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('canvas 2d not available')); return; }

      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);

      resolve(canvas.toDataURL('image/webp', 0.75));
    };

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
    img.src = url;
  });
}

/** Extrait une image depuis un ClipboardEvent */
export function getImageFromClipboard(e: ClipboardEvent): File | null {
  const items = e.clipboardData?.items;
  if (!items) return null;
  for (const item of Array.from(items)) {
    if (item.type.startsWith('image/')) {
      return item.getAsFile();
    }
  }
  return null;
}

/** Extrait une image depuis un DragEvent */
export function getImageFromDrop(e: DragEvent): File | null {
  const files = e.dataTransfer?.files;
  if (!files?.length) return null;
  for (const file of Array.from(files)) {
    if (file.type.startsWith('image/')) return file;
  }
  return null;
}
