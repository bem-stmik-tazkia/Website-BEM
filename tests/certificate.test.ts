import test from "node:test";
import assert from "node:assert/strict";
import {
  clampCertificateLayoutConfig,
  extractApplicantInfoForCertificate,
  formatCertificateNumber,
  generateCertificateCode,
  isValidCertificateCodeFormat,
  parseCertificateCsvImport,
  sanitizeCertificateAssetUrl,
  sanitizeCertificateText,
  toSameOriginStorageUrl,
} from "../src/lib/certificate-utils";
import { isSafePdfBuffer } from "../src/lib/imageValidation";
import { buildA4LandscapePdfFromJpeg } from "../src/lib/certificate-pdf";

test("generateCertificateCode returns TZK-YYYY-XXXXXXXXXX formatted 10-char unique codes", () => {
  const code1 = generateCertificateCode(new Date("2026-11-27T00:00:00Z"));
  const code2 = generateCertificateCode(new Date("2026-11-27T00:00:00Z"));

  assert.match(code1, /^TZK-2026-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{10}$/);
  assert.match(code2, /^TZK-2026-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{10}$/);
  assert.notEqual(code1, code2);
});

test("formatCertificateNumber builds Roman-month official numbers and resolves placeholders", () => {
  const date = new Date("2026-11-27T12:00:00+07:00");
  assert.equal(
    formatCertificateNumber({ prefix: "SERT/BEM-TAZKIA", sequence: 7, issuedDate: date }),
    "007/SERT/BEM-TAZKIA/XI/2026"
  );
  assert.equal(
    formatCertificateNumber({
      prefix: "NO.{SEQ}/PANITIA/{ROMAN_MONTH}-{YEAR}",
      sequence: 12,
      issuedDate: date,
    }),
    "NO.012/PANITIA/XI-2026"
  );
});

test("extractApplicantInfoForCertificate resolves only name and role across form schemas (no NIM/email)", () => {
  const info = extractApplicantInfoForCertificate(
    {
      id: "app-1",
      agenda_id: "ag-1",
      item_id: "item-1",
      item_name: "Div. Logistik",
      applicant_email: "Nazwa@student.stmik.tazkia.ac.id",
      status: "accepted",
      responses: {
        f_nama: "Nazwa Azahra",
        f_alasan: "Ingin berkontribusi",
      },
      created_at: "2026-11-26T15:07:00Z",
    },
    [{ id: "f_nama", type: "text", label: "Nama Lengkap", required: true }],
    [],
    "volunteer"
  );

  assert.equal(info.recipient_name, "Nazwa Azahra");
  assert.equal(info.role_title, "Panitia — Div. Logistik");
  assert.deepEqual(Object.keys(info).sort(), ["recipient_name", "role_title"]);
});

test("parseCertificateCsvImport parses semicolon CSV with BOM using nama and peran columns", () => {
  const csv =
    "\uFEFFnama;peran;nomor;keterangan\r\n" +
    '"Lailatul Qodria";Div. PDD;001/BEM/XI/2026;Panitia Terbaik\r\n' +
    "Ahmad Fauzan;Narasumber;;\r\n" +
    ";Peserta;;";

  const parsed = parseCertificateCsvImport(csv, "Peserta");
  assert.equal(parsed.rows.length, 2);
  assert.equal(parsed.rows[0].recipient_name, "Lailatul Qodria");
  assert.equal(parsed.rows[0].role_title, "Div. PDD");
  assert.equal(parsed.rows[0].certificate_number, "001/BEM/XI/2026");
  assert.equal(parsed.rows[0].description_override, "Panitia Terbaik");
  assert.equal(parsed.rows[1].recipient_name, "Ahmad Fauzan");
  assert.equal(parsed.rows[1].role_title, "Narasumber");
  assert.equal(parsed.errors.length, 1);
});

test("toSameOriginStorageUrl rewrites Supabase public storage URLs to same-origin /storage paths", () => {
  assert.equal(
    toSameOriginStorageUrl(
      "https://dfeokmrfwgrufruieunh.supabase.co/storage/v1/object/public/public_images/certificates/bg/sample.png"
    ),
    "/storage/public_images/certificates/bg/sample.png"
  );
  assert.equal(toSameOriginStorageUrl("/images/logo2.webp"), "/images/logo2.webp");
  assert.equal(toSameOriginStorageUrl(null), null);
});

test("sanitizeCertificateAssetUrl blocks XSS, SSRF, HTTP, SVGs, and PDFs unless explicitly allowed", () => {
  assert.equal(sanitizeCertificateAssetUrl("javascript:alert(1)"), null);
  assert.equal(sanitizeCertificateAssetUrl("data:text/html,<script>alert(1)</script>"), null);
  assert.equal(sanitizeCertificateAssetUrl("http://example.com/cert.png"), null);
  assert.equal(sanitizeCertificateAssetUrl("https://127.0.0.1/secret.png"), null);
  assert.equal(sanitizeCertificateAssetUrl("https://localhost/bg.png"), null);
  assert.equal(sanitizeCertificateAssetUrl("https://user:pass@example.com/a.png"), null);
  assert.equal(sanitizeCertificateAssetUrl("https://cdn.example.com/evil.svg"), null);
  assert.equal(
    sanitizeCertificateAssetUrl("/storage/public_images/certificates/bg/../secret.png"),
    null
  );
  assert.equal(
    sanitizeCertificateAssetUrl("https://cdn.example.com/file.pdf", { allowPdf: false }),
    null
  );
  assert.equal(
    sanitizeCertificateAssetUrl("https://cdn.example.com/file.pdf", { allowPdf: true }),
    "https://cdn.example.com/file.pdf"
  );
  assert.equal(
    sanitizeCertificateAssetUrl("/storage/public_images/certificates/custom/cert.pdf", {
      allowPdf: true,
    }),
    "/storage/public_images/certificates/custom/cert.pdf"
  );
});

test("isSafePdfBuffer accepts valid clean PDF headers and rejects embedded scripting/launch actions", () => {
  assert.equal(isSafePdfBuffer(Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n")), true);
  assert.equal(isSafePdfBuffer(Buffer.from("<html>not pdf</html>")), false);
  assert.equal(
    isSafePdfBuffer(Buffer.from("%PDF-1.4\n<< /S /JavaScript /JS (app.alert(1)) >>")),
    false
  );
  assert.equal(isSafePdfBuffer(Buffer.from("%PDF-1.4\n<< /S /Launch >>")), false);
});

test("isValidCertificateCodeFormat & sanitizeCertificateText enforce strict formats and control char removal", () => {
  assert.equal(isValidCertificateCodeFormat("TZK-2026-A2B3C4D5E6"), true);
  assert.equal(isValidCertificateCodeFormat("'; DROP TABLE certificates; --"), false);
  assert.equal(isValidCertificateCodeFormat("../secret"), false);
  assert.equal(isValidCertificateCodeFormat("abc"), false);

  assert.equal(sanitizeCertificateText("Budi\x00\x07\n Santoso  ", 12), "Budi Santoso");
});

test("clampCertificateLayoutConfig validates hex colors and clamps numeric offsets", () => {
  const clamped = clampCertificateLayoutConfig({
    textColor: "javascript:alert(1)" as string,
    accentColor: "#143470",
    contentOffsetY: 9999,
    overlayOpacity: 5,
  });
  assert.equal(clamped.textColor, undefined);
  assert.equal(clamped.accentColor, "#143470");
  assert.equal(clamped.contentOffsetY, 220);
  assert.equal(clamped.overlayOpacity, 0.9);
});

test("buildA4LandscapePdfFromJpeg emits valid single-page PDF 1.4 with A4 Landscape MediaBox", () => {
  const fakeJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0xff, 0xd9]);
  const pdf = buildA4LandscapePdfFromJpeg(fakeJpeg, 2480, 1754);

  assert.ok(pdf instanceof Uint8Array);
  const text = new TextDecoder("latin1").decode(pdf);
  assert.ok(text.startsWith("%PDF-1.4\n"));
  assert.ok(text.includes("/MediaBox [0 0 841.89 595.28]"));
  assert.ok(text.includes("/Filter /DCTDecode"));
  assert.ok(text.includes("/Width 2480 /Height 1754"));
  assert.ok(text.includes("xref\n0 6\n"));
  assert.ok(text.trimEnd().endsWith("%%EOF"));
});
