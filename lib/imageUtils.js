export function getMimeForSaveFormat(format, originalMime) {
  switch (format) {
    case 'JPG':
    case 'JPEG':
      return 'image/jpeg';
    case 'PNG':
      return 'image/png';
    case 'WebP':
      return 'image/webp';
    case 'Original':
    default:
      if (originalMime && (originalMime.startsWith('image/jpeg') || originalMime.startsWith('image/png') || originalMime.startsWith('image/webp'))) {
        return originalMime;
      }
      return 'image/jpeg';
  }
}

export function getExtensionForMime(mime, originalName) {
  const ext = originalName.split('.').pop().toLowerCase();
  switch (mime) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return ext || 'jpg';
  }
}

export async function compressCanvasToBlob(canvas, targetMime, targetBytes) {
  let mime = targetMime;

  // PNG is lossless. If target size is specified, we must convert to WebP/JPEG to support lossy compression.
  if (mime === 'image/png' && targetBytes) {
    mime = 'image/webp';
  }

  if (!targetBytes) {
    const blob = await new Promise(resolve => canvas.toBlob(resolve, mime, 0.95));
    return { blob, mime };
  }

  if (mime !== 'image/jpeg' && mime !== 'image/webp') {
    mime = 'image/webp';
  }

  let currentCanvas = canvas;
  let scale = 1.0;
  let bestBlob = null;
  let attempts = 0;
  const maxAttempts = 6; // allow scaling down up to 6 times (e.g. 0.8^6 = ~26% of original dimensions)

  while (attempts < maxAttempts) {
    let minQuality = 0.05;
    let maxQuality = 0.95;
    let quality = 0.75;
    let iterationBlob = null;
    let iterations = 0;
    const maxIterations = 6;

    while (iterations < maxIterations) {
      const blob = await new Promise(resolve => currentCanvas.toBlob(resolve, mime, quality));
      if (!blob) break;

      if (blob.size <= targetBytes) {
        iterationBlob = blob;
        minQuality = quality;
        quality = (quality + maxQuality) / 2;
      } else {
        maxQuality = quality;
        quality = (quality + minQuality) / 2;
      }
      iterations++;
    }

    if (iterationBlob) {
      bestBlob = iterationBlob;
      break;
    }

    // If no quality fit the size, extract lowest quality at this resolution
    const lowestQualityBlob = await new Promise(resolve => currentCanvas.toBlob(resolve, mime, 0.05));
    if (lowestQualityBlob) {
      bestBlob = lowestQualityBlob;
    }

    // Scale down canvas dimensions and attempt compression loop again
    scale *= 0.8;
    const newCanvas = document.createElement('canvas');
    newCanvas.width = Math.max(1, Math.round(canvas.width * scale));
    newCanvas.height = Math.max(1, Math.round(canvas.height * scale));
    const ctx = newCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(canvas, 0, 0, newCanvas.width, newCanvas.height);
      currentCanvas = newCanvas;
    } else {
      break;
    }

    attempts++;
  }

  return { blob: bestBlob, mime };
}
