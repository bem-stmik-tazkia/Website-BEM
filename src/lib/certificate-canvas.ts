"use client";

import QRCode from "qrcode";
import type { CertificateRenderData } from "@/types/certificate";
import { buildA4LandscapePdfFromJpeg, dataUrlToUint8Array } from "./certificate-pdf";
import { sanitizeCertificateFilename, toSameOriginStorageUrl } from "./certificate-utils";

export const CERTIFICATE_CANVAS_WIDTH = 2480;
export const CERTIFICATE_CANVAS_HEIGHT = 1754;

const imageCache = new Map<string, Promise<HTMLImageElement | null>>();

function loadCanvasImage(rawUrl: string | null | undefined): Promise<HTMLImageElement | null> {
  const src = toSameOriginStorageUrl(rawUrl);
  if (!src) return Promise.resolve(null);

  const cached = imageCache.get(src);
  if (cached) return cached;

  const promise = new Promise<HTMLImageElement | null>((resolve) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

  imageCache.set(src, promise);
  return promise;
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines = 3
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) {
        lines.push(current);
        if (lines.length >= maxLines) break;
      }
      current = word;
    }
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    const last = lines[maxLines - 1];
    lines[maxLines - 1] = last.length > 3 ? `${last.slice(0, -1)}…` : `${last}…`;
  }

  return lines;
}

function fitTextFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  fontBuilder: (size: number) => string,
  maxSize: number,
  minSize: number
): number {
  let size = maxSize;
  while (size > minSize) {
    ctx.font = fontBuilder(size);
    if (ctx.measureText(text).width <= maxWidth) return size;
    size -= 2;
  }
  return minSize;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawQrCodeOnCanvas(
  ctx: CanvasRenderingContext2D,
  verifyUrl: string,
  codeText: string,
  x: number,
  y: number,
  cardSize: number,
  borderColor: string,
  codeColor: string
) {
  ctx.save();
  drawRoundedRect(ctx, x, y, cardSize, cardSize + 54, 18);
  ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = borderColor;
  ctx.stroke();

  try {
    const qr = QRCode.create(verifyUrl || "https://bem.stmiktazkia.ac.id/sertifikat", {
      errorCorrectionLevel: "M",
    });
    const moduleCount = qr.modules.size;
    const pad = 18;
    const qrDrawArea = cardSize - pad * 2;
    const cellSize = qrDrawArea / moduleCount;

    ctx.fillStyle = "#0F172A";
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (qr.modules.get(row, col)) {
          ctx.fillRect(
            Math.floor(x + pad + col * cellSize),
            Math.floor(y + pad + row * cellSize),
            Math.ceil(cellSize),
            Math.ceil(cellSize)
          );
        }
      }
    }
  } catch {
    ctx.fillStyle = "#0F172A";
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("QR", x + cardSize / 2, y + cardSize / 2);
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "#64748B";
  ctx.font = "bold 14px sans-serif";
  ctx.fillText("VERIFIKASI KEASLIAN", x + cardSize / 2, y + cardSize + 14);

  ctx.fillStyle = codeColor;
  ctx.font = "bold 19px monospace";
  ctx.fillText(codeText, x + cardSize / 2, y + cardSize + 40);
  ctx.restore();
}

function drawCornerOrnament(
  ctx: CanvasRenderingContext2D,
  cornerX: number,
  cornerY: number,
  dirX: number,
  dirY: number,
  primary: string,
  accent: string
) {
  ctx.save();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(cornerX, cornerY + dirY * 115);
  ctx.lineTo(cornerX, cornerY);
  ctx.lineTo(cornerX + dirX * 115, cornerY);
  ctx.stroke();

  ctx.fillStyle = primary;
  ctx.beginPath();
  ctx.moveTo(cornerX + dirX * 18, cornerY + dirY * 18);
  ctx.lineTo(cornerX + dirX * 52, cornerY + dirY * 18);
  ctx.lineTo(cornerX + dirX * 18, cornerY + dirY * 52);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export async function renderCertificateToCanvas(
  data: CertificateRenderData,
  options?: { scale?: number; targetCanvas?: HTMLCanvasElement | null }
): Promise<HTMLCanvasElement> {
  const scale = options?.scale ?? 1;
  const width = Math.round(CERTIFICATE_CANVAS_WIDTH * scale);
  const height = Math.round(CERTIFICATE_CANVAS_HEIGHT * scale);

  const canvas = options?.targetCanvas || document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Browser canvas 2D tidak tersedia.");
  }

  const preset = data.design_preset || "classic-navy";
  const cfg = data.layout_config || {};
  const showLogo = cfg.showLogo !== false;
  const showBorder = cfg.showBorder !== false;
  const showQr = cfg.showQr !== false;
  const offsetY = Math.max(-220, Math.min(220, Number(cfg.contentOffsetY ?? 0) || 0));

  const palette =
    preset === "emerald-gold"
      ? {
          bgTop: "#F8FBF8",
          bgBottom: "#EFF7F2",
          primary: cfg.accentColor || "#064E3B",
          accent: "#D4AF37",
          text: cfg.textColor || "#0F2922",
          muted: "#47665B",
          pillBg: "#064E3B",
          pillText: "#FFFFFF",
        }
      : preset === "modern-royal"
        ? {
            bgTop: "#FFFFFF",
            bgBottom: "#F1F5FB",
            primary: cfg.accentColor || "#1E3A8A",
            accent: "#EA580C",
            text: cfg.textColor || "#0F172A",
            muted: "#475569",
            pillBg: "#1E3A8A",
            pillText: "#FFFFFF",
          }
        : {
            bgTop: "#FEFDF9",
            bgBottom: "#F6F1E5",
            primary: cfg.accentColor || "#143470",
            accent: "#C89D3C",
            text: cfg.textColor || "#102147",
            muted: "#4A5A7B",
            pillBg: "#143470",
            pillText: "#FFFFFF",
          };

  const [logoImg, bgImg, ...signerImages] = await Promise.all([
    showLogo || preset !== "custom-bg" ? loadCanvasImage("/images/logo2.webp") : Promise.resolve(null),
    preset === "custom-bg" && data.background_image_url
      ? loadCanvasImage(data.background_image_url)
      : Promise.resolve(null),
    ...(data.signers || []).slice(0, 3).map((s) => loadCanvasImage(s.signature_url)),
  ]);

  ctx.save();
  ctx.scale(scale, scale);

  const W = CERTIFICATE_CANVAS_WIDTH;
  const H = CERTIFICATE_CANVAS_HEIGHT;

  // 1. Background fill
  if (bgImg) {
    const imgRatio = bgImg.width / bgImg.height;
    const canvasRatio = W / H;
    let drawW = W;
    let drawH = H;
    let drawX = 0;
    let drawY = 0;

    if (imgRatio > canvasRatio) {
      drawW = H * imgRatio;
      drawX = (W - drawW) / 2;
    } else {
      drawH = W / imgRatio;
      drawY = (H - drawH) / 2;
    }
    ctx.drawImage(bgImg, drawX, drawY, drawW, drawH);

    const overlayAlpha = Number(cfg.overlayOpacity ?? 0);
    if (overlayAlpha > 0) {
      ctx.save();
      drawRoundedRect(ctx, 130, 110, W - 260, H - 220, 32);
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.92, Math.max(0, overlayAlpha))})`;
      ctx.fill();
      ctx.restore();
    }
  } else {
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, palette.bgTop);
    grad.addColorStop(1, palette.bgBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Subtle geometric accent ribbon for modern-royal
    if (preset === "modern-royal") {
      ctx.fillStyle = palette.primary;
      ctx.fillRect(0, 0, 74, H);
      ctx.fillStyle = palette.accent;
      ctx.fillRect(74, 0, 18, H);
      ctx.fillStyle = "rgba(30, 58, 138, 0.04)";
      ctx.beginPath();
      ctx.arc(W - 140, 140, 360, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Watermark on built-in presets
  if (logoImg && !bgImg) {
    ctx.save();
    ctx.globalAlpha = 0.045;
    const wmSize = 620;
    ctx.drawImage(logoImg, (W - wmSize) / 2, (H - wmSize) / 2 - 20, wmSize, wmSize);
    ctx.restore();
  }

  // 2. Decorative Borders
  if (showBorder && (preset !== "custom-bg" || Boolean(cfg.showBorder))) {
    if (preset === "modern-royal" && !bgImg) {
      ctx.strokeStyle = "rgba(30, 58, 138, 0.2)";
      ctx.lineWidth = 4;
      ctx.strokeRect(130, 62, W - 196, H - 124);
    } else {
      ctx.strokeStyle = palette.primary;
      ctx.lineWidth = 10;
      ctx.strokeRect(64, 64, W - 128, H - 128);

      ctx.strokeStyle = palette.accent;
      ctx.lineWidth = 3.5;
      ctx.strokeRect(86, 86, W - 172, H - 172);

      drawCornerOrnament(ctx, 108, 108, 1, 1, palette.primary, palette.accent);
      drawCornerOrnament(ctx, W - 108, 108, -1, 1, palette.primary, palette.accent);
      drawCornerOrnament(ctx, 108, H - 108, 1, -1, palette.primary, palette.accent);
      drawCornerOrnament(ctx, W - 108, H - 108, -1, -1, palette.primary, palette.accent);
    }
  }

  const centerX = preset === "modern-royal" && !bgImg ? W / 2 + 24 : W / 2;

  // 3. Header Crest & Institution Name
  let curY = 148 + offsetY * 0.4;
  if (showLogo && logoImg) {
    const logoSize = 96;
    ctx.drawImage(logoImg, centerX - logoSize / 2, curY, logoSize, logoSize);
    curY += logoSize + 24;
  } else {
    curY += 32;
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = palette.primary;
  ctx.font = "bold 26px 'Segoe UI', Arial, sans-serif";
  ctx.fillText("BADAN EKSEKUTIF MAHASISWA • STMIK TAZKIA", centerX, curY);
  curY += 68;

  // 4. Certificate Heading
  const titleFontFamily =
    preset === "modern-royal" ? "'Segoe UI', Arial, sans-serif" : "Georgia, 'Times New Roman', serif";
  const headingText = (data.subtitle || "SERTIFIKAT PENGHARGAAN").trim().toUpperCase();
  const headingSize = fitTextFontSize(
    ctx,
    headingText,
    1820,
    (s) => `bold ${s}px ${titleFontFamily}`,
    76,
    44
  );
  ctx.fillStyle = palette.text;
  ctx.font = `bold ${headingSize}px ${titleFontFamily}`;
  ctx.fillText(headingText, centerX, curY);
  curY += 54;

  // Official Number
  ctx.fillStyle = palette.muted;
  ctx.font = "bold 27px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(`Nomor: ${data.certificate_number || "-"}`, centerX, curY);
  curY += 54;

  // Divider bar
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(centerX - 180, curY);
  ctx.lineTo(centerX + 180, curY);
  ctx.stroke();
  curY += 46;

  // 5. Recipient Block
  ctx.fillStyle = palette.muted;
  ctx.font = "28px Georgia, 'Times New Roman', serif";
  ctx.fillText("Dengan bangga diberikan kepada:", centerX, curY);
  curY += 74;

  const nameText = data.recipient_name.trim() || "Nama Penerima";
  const nameSize = fitTextFontSize(
    ctx,
    nameText,
    1860,
    (s) => `bold italic ${s}px Georgia, 'Times New Roman', serif`,
    94,
    50
  );
  ctx.fillStyle = palette.primary;
  ctx.font = `bold italic ${nameSize}px Georgia, 'Times New Roman', serif`;
  ctx.fillText(nameText, centerX, curY);
  curY += 54;

  // Underline beneath recipient name
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(centerX - 420, curY);
  ctx.lineTo(centerX + 420, curY);
  ctx.stroke();
  curY += 50;

  // 6. Role & Activity Block
  ctx.fillStyle = palette.muted;
  ctx.font = "27px 'Segoe UI', Arial, sans-serif";
  ctx.fillText("Atas partisipasi dan kontribusinya sebagai:", centerX, curY);
  curY += 54;

  // Role Ribbon Pill
  const roleText = (data.role_title || "Peserta").trim();
  const roleFontSize = fitTextFontSize(
    ctx,
    roleText,
    1360,
    (s) => `bold ${s}px 'Segoe UI', Arial, sans-serif`,
    36,
    24
  );
  ctx.font = `bold ${roleFontSize}px 'Segoe UI', Arial, sans-serif`;
  const roleMeasuredWidth = ctx.measureText(roleText).width;
  const pillW = Math.min(1560, Math.max(360, roleMeasuredWidth + 110));
  const pillH = 64;

  drawRoundedRect(ctx, centerX - pillW / 2, curY - pillH / 2, pillW, pillH, 32);
  ctx.fillStyle = palette.pillBg;
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = palette.accent;
  ctx.stroke();

  ctx.fillStyle = palette.pillText;
  ctx.fillText(roleText, centerX, curY + 2);
  curY += 72;

  // Activity Title (up to 2 lines)
  ctx.fillStyle = palette.text;
  ctx.font = "bold 42px 'Segoe UI', Arial, sans-serif";
  const activityLines = wrapLines(ctx, data.activity_title || "Kegiatan BEM STMIK Tazkia", 1820, 2);
  for (const line of activityLines) {
    ctx.fillText(line, centerX, curY);
    curY += 50;
  }

  // Date & Location metadata line
  const metaParts = [data.activity_date_label?.trim(), data.location?.trim()].filter(Boolean);
  if (metaParts.length > 0) {
    ctx.fillStyle = palette.muted;
    ctx.font = "25px 'Segoe UI', Arial, sans-serif";
    ctx.fillText(metaParts.join("  •  "), centerX, curY + 4);
    curY += 42;
  }

  // Optional description lines
  if (data.description && data.description.trim()) {
    ctx.fillStyle = palette.muted;
    ctx.font = "24px 'Segoe UI', Arial, sans-serif";
    const descLines = wrapLines(ctx, data.description.trim(), 1680, 2);
    for (const line of descLines) {
      ctx.fillText(line, centerX, curY + 6);
      curY += 34;
    }
  }

  // 7. Bottom Footer: QR Verification + City/Date + Signers
  const qrCardX = preset === "modern-royal" && !bgImg ? 170 : 148;
  const qrCardY = 1368;
  const qrCardSize = 196;

  if (showQr) {
    drawQrCodeOnCanvas(
      ctx,
      data.verifyUrl,
      data.certificate_code,
      qrCardX,
      qrCardY,
      qrCardSize,
      palette.accent,
      palette.primary
    );
  }

  const signers = (data.signers || []).filter((s) => s.name?.trim() || s.role?.trim()).slice(0, 3);
  const sigAreaLeft = showQr ? qrCardX + qrCardSize + 75 : 180;
  const sigAreaRight = W - 150;
  const sigAreaCenter = (sigAreaLeft + sigAreaRight) / 2;

  // Issue city & date header above signers
  const city = data.issued_city?.trim() || "Bogor";
  const issuedDate = data.issued_date_label?.trim() || "";
  if (issuedDate) {
    ctx.fillStyle = palette.muted;
    ctx.textAlign = "center";
    ctx.font = "bold 25px 'Segoe UI', Arial, sans-serif";
    ctx.fillText(`${city}, ${issuedDate}`, sigAreaCenter, 1300);
  }

  if (signers.length > 0) {
    const colWidth = (sigAreaRight - sigAreaLeft) / signers.length;
    signers.forEach((signer, idx) => {
      const colCenter = sigAreaLeft + colWidth * (idx + 0.5);
      const sigImg = signerImages[idx];

      if (sigImg) {
        const maxSigW = 240;
        const maxSigH = 104;
        const ratio = Math.min(maxSigW / sigImg.width, maxSigH / sigImg.height);
        const w = sigImg.width * ratio;
        const h = sigImg.height * ratio;
        ctx.drawImage(sigImg, colCenter - w / 2, 1348 + (maxSigH - h) / 2, w, h);
      }

      // Signature baseline
      ctx.strokeStyle = palette.primary;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(colCenter - 150, 1468);
      ctx.lineTo(colCenter + 150, 1468);
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.fillStyle = palette.text;
      const signerName = signer.name?.trim() || "-";
      const signerFontSize = fitTextFontSize(
        ctx,
        signerName,
        Math.max(260, colWidth - 40),
        (s) => `bold ${s}px 'Segoe UI', Arial, sans-serif`,
        27,
        20
      );
      ctx.font = `bold ${signerFontSize}px 'Segoe UI', Arial, sans-serif`;
      ctx.fillText(signerName, colCenter, 1504);

      if (signer.role?.trim()) {
        ctx.fillStyle = palette.muted;
        ctx.font = "21px 'Segoe UI', Arial, sans-serif";
        const roleLines = wrapLines(ctx, signer.role.trim(), Math.max(260, colWidth - 36), 2);
        roleLines.forEach((line, lIdx) => {
          ctx.fillText(line, colCenter, 1538 + lIdx * 28);
        });
      }
    });
  }

  ctx.restore();
  return canvas;
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.style.display = "none";
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(anchor);
}

export async function downloadCertificatePng(
  data: CertificateRenderData,
  baseFilename?: string
) {
  const canvas = await renderCertificateToCanvas(data, { scale: 1 });
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error("Gagal membuat file PNG."))),
      "image/png"
    );
  });

  const safeName = sanitizeCertificateFilename(
    baseFilename || `E-Sertifikat_${data.recipient_name}_${data.certificate_code}`
  );
  triggerBlobDownload(blob, `${safeName}.png`);
}

export async function downloadCertificatePdf(
  data: CertificateRenderData,
  baseFilename?: string
) {
  const canvas = await renderCertificateToCanvas(data, { scale: 1 });
  const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.94);
  const jpegBytes = dataUrlToUint8Array(jpegDataUrl);
  const pdfBytes = buildA4LandscapePdfFromJpeg(
    jpegBytes,
    canvas.width,
    canvas.height
  );

  const pdfBuffer = new Uint8Array(pdfBytes).buffer;
  const blob = new Blob([pdfBuffer], { type: "application/pdf" });

  const safeName = sanitizeCertificateFilename(
    baseFilename || `E-Sertifikat_${data.recipient_name}_${data.certificate_code}`
  );
  triggerBlobDownload(blob, `${safeName}.pdf`);
}
