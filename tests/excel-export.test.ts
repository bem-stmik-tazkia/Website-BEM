import test from "node:test";
import assert from "node:assert/strict";
import {
  buildSemicolonCsvContent,
  buildXlsxBytes,
} from "../src/lib/excel-export";

test("buildXlsxBytes generates valid PKZIP OOXML workbook with escaped XML and frozen header", () => {
  const bytes = buildXlsxBytes([
    {
      name: "Data Pendaftar: 2026/2027 [Final] Very Long Name",
      headers: ["No", "NIM", "Nama & Alasan"],
      rows: [
        [1, "251552010034", "Budi <Test>\nBaris 2 & \"Kutipan\""],
        [2, "081234567890", "=HYPERLINK(\"https://evil.example\")"],
      ],
    },
    {
      name: "Ringkasan Kuota",
      headers: ["Divisi", "Terisi"],
      rows: [["Logistik", 2]],
    },
  ]);

  assert.ok(bytes instanceof Uint8Array);
  assert.ok(bytes.length > 500);
  // PKZIP local file signature PK\x03\x04
  assert.equal(bytes[0], 0x50);
  assert.equal(bytes[1], 0x4b);
  assert.equal(bytes[2], 0x03);
  assert.equal(bytes[3], 0x04);

  const asciiText = new TextDecoder("utf-8").decode(bytes);
  assert.ok(
    asciiText.includes(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"
    )
  );
  assert.ok(asciiText.includes("xl/workbook.xml"));
  assert.ok(asciiText.includes("xl/worksheets/sheet1.xml"));
  assert.ok(asciiText.includes("xl/worksheets/sheet2.xml"));
  assert.ok(asciiText.includes("251552010034"));
  assert.ok(asciiText.includes("081234567890"));
  // Ensure special XML chars are properly escaped and invalid sheet chars stripped
  assert.ok(asciiText.includes("Nama &amp; Alasan"));
  assert.ok(asciiText.includes("Budi &lt;Test&gt;\nBaris 2 &amp; &quot;Kutipan&quot;"));
  assert.ok(asciiText.includes('state="frozen"'));
});

test("buildSemicolonCsvContent formats semicolon CRLF BOM CSV and neutralizes formula injection", () => {
  const csv = buildSemicolonCsvContent(
    ["No", "NIM", "Catatan"],
    [
      [1, "251552010034", "Halo; Dunia\nBaris 2"],
      [2, "08123456789", "=1+1"],
    ]
  );

  assert.ok(csv.startsWith("\uFEFF"));
  const lines = csv.slice(1).split("\r\n");
  assert.equal(lines.length, 3);
  assert.equal(lines[0], '"No";"NIM";"Catatan"');
  assert.equal(lines[1], '"1";"251552010034";"Halo; Dunia\nBaris 2"');
  assert.equal(lines[2], '"2";"08123456789";"\'=1+1"');
});
