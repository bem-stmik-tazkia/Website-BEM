export type QrDownloadTheme = "light" | "dark";

const QR_API = "https://api.qrserver.com/v1/create-qr-code/";

function buildQrUrl(shareUrl: string, size: number, margin: number) {
  return `${QR_API}?size=${size}x${size}&data=${encodeURIComponent(shareUrl)}&margin=${margin}`;
}

function applyTransparency(imageData: ImageData, theme: QrDownloadTheme) {
  const { data } = imageData;

  for (let i = 0; i < data.length; i += 4) {
    const luminance = (data[i] + data[i + 1] + data[i + 2]) / 3;
    const isDark = luminance < 128;

    if (theme === "light") {
      // White modules on transparent background (same shape as black QR)
      if (isDark) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = 255;
      } else {
        data[i + 3] = 0;
      }
    } else {
      // Black barcode on transparent background
      if (isDark) {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = 255;
      } else {
        data[i + 3] = 0;
      }
    }
  }
}

export async function downloadTransparentQr(
  shareUrl: string,
  theme: QrDownloadTheme,
  filename: string
) {
  const response = await fetch(buildQrUrl(shareUrl, 500, 2));
  if (!response.ok) {
    throw new Error("Failed to fetch QR code");
  }

  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);

  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas is not supported");
  }

  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  applyTransparency(imageData, theme);
  ctx.putImageData(imageData, 0, 0);

  const pngBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) {
        resolve(result);
      } else {
        reject(new Error("Failed to create PNG"));
      }
    }, "image/png");
  });

  const url = window.URL.createObjectURL(pngBlob);
  const anchor = document.createElement("a");
  anchor.style.display = "none";
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(anchor);
}

export function getQrPreviewUrl(
  shareUrl: string,
  theme: QrDownloadTheme,
  size = 180
) {
  const themeParams = theme === "dark" ? "&color=ffffff&bgcolor=1a1a1a" : "";
  return `${QR_API}?size=${size}x${size}&data=${encodeURIComponent(shareUrl)}&margin=0${themeParams}`;
}
