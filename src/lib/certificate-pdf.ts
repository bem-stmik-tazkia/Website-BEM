/**
 * Minimal, dependency-free PDF 1.4 generator for exact A4 Landscape pages
 * embedding JPEG raster data via /DCTDecode XObject streams.
 */

const A4_LANDSCAPE_WIDTH_PT = 841.89;
const A4_LANDSCAPE_HEIGHT_PT = 595.28;

export function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const commaIdx = dataUrl.indexOf(",");
  const base64 = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;

  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(base64, "base64"));
  }

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function concatBytes(chunks: Uint8Array[]): Uint8Array {
  let total = 0;
  for (const chunk of chunks) total += chunk.length;
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

/**
 * Wraps raw JPEG bytes inside a single-page A4 Landscape PDF 1.4 document.
 */
export function buildA4LandscapePdfFromJpeg(
  jpegBytes: Uint8Array,
  pixelWidth: number,
  pixelHeight: number
): Uint8Array {
  if (!(jpegBytes instanceof Uint8Array) || jpegBytes.length < 4) {
    throw new Error("JPEG image bytes are empty or invalid.");
  }
  if (pixelWidth <= 0 || pixelHeight <= 0) {
    throw new Error("Invalid pixel dimensions for certificate PDF.");
  }

  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  const offsets: number[] = [];
  let cursor = 0;

  const pushBytes = (bytes: Uint8Array) => {
    parts.push(bytes);
    cursor += bytes.length;
  };
  const pushText = (text: string) => {
    pushBytes(encoder.encode(text));
  };

  // Header + binary marker bytes per PDF 1.4 specification
  pushBytes(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

  // 1 0 obj: Catalog
  offsets.push(cursor);
  pushText("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  // 2 0 obj: Pages
  offsets.push(cursor);
  pushText("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");

  // 3 0 obj: Page
  offsets.push(cursor);
  pushText(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4_LANDSCAPE_WIDTH_PT} ${A4_LANDSCAPE_HEIGHT_PT}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`
  );

  // 4 0 obj: JPEG Image XObject
  offsets.push(cursor);
  pushText(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${Math.round(pixelWidth)} /Height ${Math.round(pixelHeight)} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`
  );
  pushBytes(jpegBytes);
  pushText("\nendstream\nendobj\n");

  // 5 0 obj: Content Stream drawing full-bleed A4 Landscape image
  const drawCmd = `q\n${A4_LANDSCAPE_WIDTH_PT} 0 0 ${A4_LANDSCAPE_HEIGHT_PT} 0 0 cm\n/Im0 Do\nQ\n`;
  offsets.push(cursor);
  pushText(`5 0 obj\n<< /Length ${drawCmd.length} >>\nstream\n${drawCmd}endstream\nendobj\n`);

  // Cross-reference table
  const xrefOffset = cursor;
  pushText(`xref\n0 ${offsets.length + 1}\n`);
  pushText("0000000000 65535 f \n");
  for (const offset of offsets) {
    pushText(`${String(offset).padStart(10, "0")} 00000 n \n`);
  }

  pushText(
    `trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`
  );

  return concatBytes(parts);
}
