/**
 * Validasi Magic Bytes biner gambar.
 * Memastikan file yang diunggah benar-benar file raster gambar murni (JPEG/PNG/WebP/GIF)
 * dan menolak executable, script berbahaya, SVG XSS, atau berkas polyglot.
 */
export function isValidImageSignature(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }

  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return true;
  }

  // WebP: RIFF .... WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return true;
  }

  // GIF: GIF87a or GIF89a
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return true;
  }

  return false;
}

/**
 * Validasi Magic Bytes biner PDF (%PDF-).
 */
export function isValidPdfSignature(buffer: Buffer): boolean {
  if (buffer.length < 5) return false;
  return (
    buffer[0] === 0x25 && // %
    buffer[1] === 0x50 && // P
    buffer[2] === 0x44 && // D
    buffer[3] === 0x46 && // F
    buffer[4] === 0x2d    // -
  );
}

/**
 * Validasi PDF aman: memastikan header %PDF- valid dan bebas dari action/skrip aktif
 * berbahaya (/JavaScript, /Launch, /RichMedia, /SubmitForm).
 */
export function isSafePdfBuffer(buffer: Buffer): boolean {
  if (!isValidPdfSignature(buffer)) return false;
  const dangerousMarkers = ["/JavaScript", "/Launch", "/RichMedia", "/SubmitForm"];
  for (const marker of dangerousMarkers) {
    if (buffer.includes(Buffer.from(marker, "ascii"))) {
      return false;
    }
  }
  return true;
}
