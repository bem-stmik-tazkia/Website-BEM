/**
 * Zero-dependency OOXML (.xlsx) & Excel-friendly CSV generator.
 * Ensures spreadsheets open with proper columns, auto widths, frozen headers,
 * wrapped multi-line cells, and text-safe IDs/phone numbers (no 2.61E+11 truncation).
 */

export interface ExcelSheetInput {
  name: string;
  headers: string[];
  rows: Array<Array<string | number | boolean | null | undefined>>;
}

const textEncoder = new TextEncoder();

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function escapeXml(raw: unknown): string {
  const str = String(raw ?? "")
    // Strip XML 1.0 illegal control characters while preserving \t (0x09), \n (0x0A), \r (0x0D)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/\r\n?/g, "\n");
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function sanitizeSheetName(name: string, index: number): string {
  const cleaned = (name || `Sheet${index + 1}`)
    .replace(/[\\/?*\[\]:]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 31);
  return cleaned || `Sheet${index + 1}`;
}

function toColLetter(colIndexOneBased: number): string {
  let n = colIndexOneBased;
  let result = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

function computeColumnWidths(
  headers: string[],
  rows: Array<Array<string | number | boolean | null | undefined>>
): number[] {
  return headers.map((header, colIdx) => {
    let maxLen = Math.max(10, String(header || "").length + 4);
    for (const row of rows) {
      const cellStr = String(row[colIdx] ?? "");
      const lines = cellStr.split(/\r?\n/);
      for (const line of lines) {
        if (line.length + 2 > maxLen) {
          maxLen = line.length + 2;
        }
      }
    }
    return Math.min(46, Math.max(12, maxLen));
  });
}

function estimateRowHeight(
  row: Array<string | number | boolean | null | undefined>,
  colWidths: number[]
): number {
  let maxVisualLines = 1;
  for (let i = 0; i < colWidths.length; i++) {
    const val = String(row[i] ?? "");
    if (!val) continue;
    const effectiveWidth = Math.max(8, colWidths[i] - 3);
    let cellLines = 0;
    for (const seg of val.split(/\r?\n/)) {
      cellLines += Math.max(1, Math.ceil(seg.length / effectiveWidth));
    }
    if (cellLines > maxVisualLines) {
      maxVisualLines = cellLines;
    }
  }
  return Math.min(220, Math.max(22, maxVisualLines * 15 + 8));
}

function buildWorksheetXml(sheet: ExcelSheetInput): string {
  const colWidths = computeColumnWidths(sheet.headers, sheet.rows);
  const colCount = Math.max(1, sheet.headers.length);
  const lastCol = toColLetter(colCount);
  const totalRows = sheet.rows.length + 1;

  const colsXml = colWidths
    .map(
      (width, idx) =>
        `<col min="${idx + 1}" max="${idx + 1}" width="${width.toFixed(1)}" customWidth="1"/>`
    )
    .join("");

  const headerCellsXml = sheet.headers
    .map((h, colIdx) => {
      const ref = `${toColLetter(colIdx + 1)}1`;
      return `<c r="${ref}" s="1" t="inlineStr"><is><t xml:space="preserve">${escapeXml(h)}</t></is></c>`;
    })
    .join("");

  const rowsXmlParts: string[] = [
    `<row r="1" ht="28" customHeight="1">${headerCellsXml}</row>`,
  ];

  sheet.rows.forEach((row, rIdx) => {
    const excelRow = rIdx + 2;
    const styleIdx = rIdx % 2 === 0 ? 0 : 2;
    const ht = estimateRowHeight(row, colWidths);
    const cellsXml = sheet.headers
      .map((_, colIdx) => {
        const ref = `${toColLetter(colIdx + 1)}${excelRow}`;
        const rawVal = row[colIdx];
        const cellText = rawVal === null || rawVal === undefined ? "" : String(rawVal);
        return `<c r="${ref}" s="${styleIdx}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(cellText)}</t></is></c>`;
      })
      .join("");
    rowsXmlParts.push(
      `<row r="${excelRow}" ht="${ht}" customHeight="1">${cellsXml}</row>`
    );
  });

  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>` +
    `<sheetFormatPr defaultRowHeight="20"/>` +
    `<cols>${colsXml}</cols>` +
    `<sheetData>${rowsXmlParts.join("")}</sheetData>` +
    `<autoFilter ref="A1:${lastCol}${totalRows}"/>` +
    `<pageSetup orientation="landscape" paperSize="9" fitToWidth="1" fitToHeight="0"/>` +
    `</worksheet>`
  );
}

function buildStylesXml(): string {
  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<fonts count="2">` +
    `<font><sz val="11"/><color rgb="FF1E293B"/><name val="Calibri"/></font>` +
    `<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>` +
    `</fonts>` +
    `<fills count="4">` +
    `<fill><patternFill patternType="none"/></fill>` +
    `<fill><patternFill patternType="gray125"/></fill>` +
    `<fill><patternFill patternType="solid"><fgColor rgb="FF1B4086"/><bgColor indexed="64"/></patternFill></fill>` +
    `<fill><patternFill patternType="solid"><fgColor rgb="FFF8FAFC"/><bgColor indexed="64"/></patternFill></fill>` +
    `</fills>` +
    `<borders count="2">` +
    `<border><left/><right/><top/><bottom/><diagonal/></border>` +
    `<border>` +
    `<left style="thin"><color rgb="FFCBD5E1"/></left>` +
    `<right style="thin"><color rgb="FFCBD5E1"/></right>` +
    `<top style="thin"><color rgb="FFCBD5E1"/></top>` +
    `<bottom style="thin"><color rgb="FFCBD5E1"/></bottom>` +
    `<diagonal/>` +
    `</border>` +
    `</borders>` +
    `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
    `<cellXfs count="3">` +
    `<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>` +
    `<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>` +
    `<xf numFmtId="0" fontId="0" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>` +
    `</cellXfs>` +
    `</styleSheet>`
  );
}

interface ZipEntrySpec {
  name: string;
  content: Uint8Array;
}

function buildStoredZip(entries: ZipEntrySpec[]): Uint8Array {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  const dosTime = 0x0000;
  const dosDate = 0x5c21; // 2026-01-01
  const utf8Flags = 0x0800;

  for (const entry of entries) {
    const nameBytes = textEncoder.encode(entry.name);
    const data = entry.content;
    const sum = crc32(data);

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const ldv = new DataView(localHeader.buffer);
    ldv.setUint32(0, 0x04034b50, true);
    ldv.setUint16(4, 20, true);
    ldv.setUint16(6, utf8Flags, true);
    ldv.setUint16(8, 0, true); // compression = STORE
    ldv.setUint16(10, dosTime, true);
    ldv.setUint16(12, dosDate, true);
    ldv.setUint32(14, sum, true);
    ldv.setUint32(18, data.length, true);
    ldv.setUint32(22, data.length, true);
    ldv.setUint16(26, nameBytes.length, true);
    ldv.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cdv = new DataView(centralHeader.buffer);
    cdv.setUint32(0, 0x02014b50, true);
    cdv.setUint16(4, 20, true);
    cdv.setUint16(6, 20, true);
    cdv.setUint16(8, utf8Flags, true);
    cdv.setUint16(10, 0, true);
    cdv.setUint16(12, dosTime, true);
    cdv.setUint16(14, dosDate, true);
    cdv.setUint32(16, sum, true);
    cdv.setUint32(20, data.length, true);
    cdv.setUint32(24, data.length, true);
    cdv.setUint16(28, nameBytes.length, true);
    cdv.setUint16(30, 0, true);
    cdv.setUint16(32, 0, true);
    cdv.setUint16(34, 0, true);
    cdv.setUint16(36, 0, true);
    cdv.setUint32(38, 0, true);
    cdv.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);

    localParts.push(localHeader, data);
    centralParts.push(centralHeader);
    offset += localHeader.length + data.length;
  }

  let centralSize = 0;
  for (const part of centralParts) centralSize += part.length;

  const eocd = new Uint8Array(22);
  const edv = new DataView(eocd.buffer);
  edv.setUint32(0, 0x06054b50, true);
  edv.setUint16(4, 0, true);
  edv.setUint16(6, 0, true);
  edv.setUint16(8, entries.length, true);
  edv.setUint16(10, entries.length, true);
  edv.setUint32(12, centralSize, true);
  edv.setUint32(16, offset, true);
  edv.setUint16(20, 0, true);

  const totalSize = offset + centralSize + eocd.length;
  const output = new Uint8Array(totalSize);
  let cursor = 0;
  for (const p of localParts) {
    output.set(p, cursor);
    cursor += p.length;
  }
  for (const p of centralParts) {
    output.set(p, cursor);
    cursor += p.length;
  }
  output.set(eocd, cursor);
  return output;
}

export function buildXlsxBytes(sheetsInput: ExcelSheetInput[]): Uint8Array {
  const sheets = sheetsInput.map((s, idx) => ({
    ...s,
    name: sanitizeSheetName(s.name, idx),
  }));

  const usedNames = new Set<string>();
  for (const s of sheets) {
    let candidate = s.name;
    let suffix = 2;
    while (usedNames.has(candidate.toLowerCase())) {
      const tail = ` ${suffix++}`;
      candidate = `${s.name.slice(0, 31 - tail.length)}${tail}`;
    }
    s.name = candidate;
    usedNames.add(candidate.toLowerCase());
  }

  const sheetOverrides = sheets
    .map(
      (_, idx) =>
        `<Override PartName="/xl/worksheets/sheet${idx + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
    )
    .join("");

  const contentTypesXml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.workbook+xml"/>` +
    `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
    sheetOverrides +
    `</Types>`;

  const rootRelsXml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
    `</Relationships>`;

  const workbookSheetsXml = sheets
    .map(
      (s, idx) =>
        `<sheet name="${escapeXml(s.name)}" sheetId="${idx + 1}" r:id="rId${idx + 1}"/>`
    )
    .join("");

  const workbookXml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
    `<sheets>${workbookSheetsXml}</sheets>` +
    `</workbook>`;

  const sheetRelsXml = sheets
    .map(
      (_, idx) =>
        `<Relationship Id="rId${idx + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${idx + 1}.xml"/>`
    )
    .join("");

  const workbookRelsXml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    sheetRelsXml +
    `<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
    `</Relationships>`;

  const zipEntries: ZipEntrySpec[] = [
    { name: "[Content_Types].xml", content: textEncoder.encode(contentTypesXml) },
    { name: "_rels/.rels", content: textEncoder.encode(rootRelsXml) },
    { name: "xl/workbook.xml", content: textEncoder.encode(workbookXml) },
    { name: "xl/_rels/workbook.xml.rels", content: textEncoder.encode(workbookRelsXml) },
    { name: "xl/styles.xml", content: textEncoder.encode(buildStylesXml()) },
    ...sheets.map((s, idx) => ({
      name: `xl/worksheets/sheet${idx + 1}.xml`,
      content: textEncoder.encode(buildWorksheetXml(s)),
    })),
  ];

  return buildStoredZip(zipEntries);
}

/**
 * Generates semicolon-delimited UTF-8 CSV with CRLF line endings for Indonesian/European Excel compatibility
 * and neutralizes formula injection (=, +, -, @) while preserving numeric readability.
 */
export function buildSemicolonCsvContent(
  headers: string[],
  rows: Array<Array<string | number | boolean | null | undefined>>,
  delimiter = ";"
): string {
  const escapeCell = (raw: unknown): string => {
    let str = String(raw ?? "").replace(/\r\n?/g, "\n");
    if (/^[=+\-@\t\r]/.test(str)) {
      str = `'${str}`;
    }
    return `"${str.replace(/"/g, '""')}"`;
  };

  const lines = [
    headers.map(escapeCell).join(delimiter),
    ...rows.map((row) => headers.map((_, i) => escapeCell(row[i])).join(delimiter)),
  ];

  return "\uFEFF" + lines.join("\r\n");
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadXlsxWorkbook(
  filename: string,
  sheets: ExcelSheetInput[]
): void {
  const bytes = buildXlsxBytes(sheets);
  const safeName = filename.toLowerCase().endsWith(".xlsx")
    ? filename
    : `${filename}.xlsx`;
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const blob = new Blob([copy.buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerBlobDownload(blob, safeName);
}

export function downloadCsvFile(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number | boolean | null | undefined>>,
  delimiter = ";"
): void {
  const csvContent = buildSemicolonCsvContent(headers, rows, delimiter);
  const safeName = filename.toLowerCase().endsWith(".csv")
    ? filename
    : `${filename}.csv`;
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  triggerBlobDownload(blob, safeName);
}
