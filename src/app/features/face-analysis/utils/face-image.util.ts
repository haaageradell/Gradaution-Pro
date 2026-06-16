export interface PrepareFaceImageOptions {
  /** Mirror horizontally (selfie camera captures). */
  mirror?: boolean;
  /** Crop around the center so the face fills more of the frame. */
  cropCenter?: boolean;
  cropWidthRatio?: number;
  cropHeightRatio?: number;
  /** Upscale when the shortest edge is below this value (px). */
  minShortEdge?: number;
  jpegQuality?: number;
}

const DEFAULT_OPTIONS: Required<PrepareFaceImageOptions> = {
  mirror: false,
  cropCenter: true,
  cropWidthRatio: 0.72,
  cropHeightRatio: 0.82,
  minShortEdge: 1024,
  jpegQuality: 0.92,
};

export async function prepareFaceImageForAnalysis(
  file: File,
  options: PrepareFaceImageOptions = {},
): Promise<{ file: File; dataUrl: string }> {
  const settings = { ...DEFAULT_OPTIONS, ...options };
  const source = await loadImageFromFile(file);

  let width = source.naturalWidth;
  let height = source.naturalHeight;

  if (width <= 0 || height <= 0) {
    throw new Error('Could not read image dimensions. Please try another photo.');
  }

  let sx = 0;
  let sy = 0;
  let sw = width;
  let sh = height;

  if (settings.cropCenter) {
    sw = Math.round(width * settings.cropWidthRatio);
    sh = Math.round(height * settings.cropHeightRatio);
    sx = Math.round((width - sw) / 2);
    sy = Math.round((height - sh) / 2);
  }

  const shortEdge = Math.min(sw, sh);
  const scale =
    shortEdge < settings.minShortEdge ? settings.minShortEdge / shortEdge : 1;
  const targetWidth = Math.round(sw * scale);
  const targetHeight = Math.round(sh * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not prepare image for analysis.');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (settings.mirror) {
    ctx.translate(targetWidth, 0);
    ctx.scale(-1, 1);
  }

  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);

  const dataUrl = canvas.toDataURL('image/jpeg', settings.jpegQuality);
  const preparedFile = dataUrlToFile(
    dataUrl,
    file.name.replace(/\.\w+$/, '') + '_face.jpg',
  );

  return { file: preparedFile, dataUrl };
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load the selected image.'));
    };

    image.src = url;
  });
}

function dataUrlToFile(dataUrl: string, fileName: string): File {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new File([bytes], fileName, { type: mime });
}
