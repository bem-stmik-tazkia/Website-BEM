import test from "node:test";
import assert from "node:assert/strict";
import { isValidImageSignature } from "../src/lib/imageValidation";
import {
  buildBaseAgendaSlug,
  combineDeadlineWib,
  extractGoogleDriveFileId,
  formatAgendaSaveErrorMessage,
  getRegistrationImagePreviewUrl,
  getSafeHttpsUrl,
  isOwnRegistrationStorageUrl,
  parseDeadlineInstant,
  parsePositiveQuota,
  splitDeadlineWib,
} from "../src/lib/registration-utils";
import {
  aggregateAgendaItemsAndCounts,
  hasAnyFormQuestions,
  hasAnyImageField,
  isAllowedDocumentUrl,
  isDeadlinePassedJakarta,
  isHostnameAllowed,
  validateItemSelection,
  validateMultiItemRegistrationResponses,
  validateRegistrationResponses,
} from "../src/lib/registration-validation";
import type { AgendaItem, AgendaKegiatan, DynamicFormField } from "../src/types/agenda";

// -----------------------------------------------------------------------------
// 1. Magic Bytes Validation (Image Upload Security)
// -----------------------------------------------------------------------------
test("isValidImageSignature accepts JPEG, PNG, WebP, and GIF magic bytes", () => {
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  const webp = Buffer.from([
    0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
  ]);
  const gif = Buffer.from("GIF89a\x01\x00\x01\x00\x00\x00", "binary");

  assert.equal(isValidImageSignature(jpeg), true);
  assert.equal(isValidImageSignature(png), true);
  assert.equal(isValidImageSignature(webp), true);
  assert.equal(isValidImageSignature(gif), true);
});

test("isValidImageSignature rejects SVG XSS, executables, PDF, and short buffers", () => {
  const svg = Buffer.from('<svg onload="alert(1)"></svg>');
  const pdf = Buffer.from("%PDF-1.7\n1 0 obj");
  const aviRiff = Buffer.from("RIFF\x00\x00\x00\x00AVI ");
  const tooShort = Buffer.from([0xff, 0xd8, 0xff]);

  assert.equal(isValidImageSignature(svg), false);
  assert.equal(isValidImageSignature(pdf), false);
  assert.equal(isValidImageSignature(aviRiff), false);
  assert.equal(isValidImageSignature(tooShort), false);
});

// -----------------------------------------------------------------------------
// 2. URL Safety & Photo Preview Resolution
// -----------------------------------------------------------------------------
test("getSafeHttpsUrl allows https only and blocks http/javascript/invalid URLs", () => {
  assert.deepEqual(getSafeHttpsUrl("https://drive.google.com/file/d/abc123/view"), {
    href: "https://drive.google.com/file/d/abc123/view",
    hostname: "drive.google.com",
  });
  assert.equal(getSafeHttpsUrl("http://drive.google.com/file/d/abc"), null);
  assert.equal(getSafeHttpsUrl("javascript:alert(1)"), null);
  assert.equal(getSafeHttpsUrl("not-a-url"), null);
  assert.equal(getSafeHttpsUrl(null), null);
});

test("getRegistrationImagePreviewUrl converts Google Drive & preserves Supabase/direct image URLs", () => {
  assert.equal(extractGoogleDriveFileId("https://drive.google.com/file/d/1AbC_xYz99/view?usp=sharing"), "1AbC_xYz99");
  assert.equal(extractGoogleDriveFileId("https://drive.google.com/open?id=99Zz_11"), "99Zz_11");

  assert.equal(
    getRegistrationImagePreviewUrl("https://drive.google.com/file/d/1AbC_xYz99/view"),
    "https://drive.google.com/thumbnail?id=1AbC_xYz99&sz=w800"
  );
  assert.equal(
    getRegistrationImagePreviewUrl(
      "https://example.supabase.co/storage/v1/object/public/public_images/pendaftaran/123/photo.webp"
    ),
    "https://example.supabase.co/storage/v1/object/public/public_images/pendaftaran/123/photo.webp"
  );
  assert.equal(
    getRegistrationImagePreviewUrl("https://cdn.example.com/poster.png?v=1"),
    "https://cdn.example.com/poster.png?v=1"
  );
  assert.equal(getRegistrationImagePreviewUrl("https://notion.so/my-doc"), null);
});

test("isOwnRegistrationStorageUrl strictly validates project host and pendaftaran folder", () => {
  const prevUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://myproj.supabase.co";

  try {
    assert.equal(
      isOwnRegistrationStorageUrl(
        "https://myproj.supabase.co/storage/v1/object/public/public_images/pendaftaran/ag1/img.jpg"
      ),
      true
    );
    assert.equal(
      isOwnRegistrationStorageUrl(
        "https://other.supabase.co/storage/v1/object/public/public_images/pendaftaran/ag1/img.jpg"
      ),
      false
    );
    assert.equal(
      isOwnRegistrationStorageUrl(
        "https://myproj.supabase.co/storage/v1/object/public/public_images/berita/img.jpg"
      ),
      false
    );
  } finally {
    if (prevUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_URL = prevUrl;
    }
  }
});

// -----------------------------------------------------------------------------
// 3. Deadline (Asia/Jakarta WIB) & Document URL Allowlist
// -----------------------------------------------------------------------------
test("isDeadlinePassedJakarta respects WIB midnight boundary", () => {
  // 2026-11-25 16:59:00 UTC === 2026-11-25 23:59:00 WIB (still 25 Nov in Jakarta!)
  const stillNov25Wib = new Date("2026-11-25T16:59:00.000Z");
  // 2026-11-25 17:01:00 UTC === 2026-11-26 00:01:00 WIB (already 26 Nov in Jakarta!)
  const earlyNov26Wib = new Date("2026-11-25T17:01:00.000Z");

  assert.equal(isDeadlinePassedJakarta("2026-11-25", stillNov25Wib), false);
  assert.equal(isDeadlinePassedJakarta("2026-11-25", earlyNov26Wib), true);
  assert.equal(isDeadlinePassedJakarta(null, earlyNov26Wib), false);
});

test("isAllowedDocumentUrl blocks spoofed domains, IPs, credentials, and allows allowlisted or own storage images", () => {
  const prevUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://myproj.supabase.co";

  try {
    assert.equal(isHostnameAllowed("drive.google.com"), true);
    assert.equal(isHostnameAllowed("sub.github.com"), true);
    assert.equal(isHostnameAllowed("drive.google.com.evil.com"), false);
    assert.equal(isHostnameAllowed("evildrive.google.com"), false);

    assert.equal(isAllowedDocumentUrl("https://drive.google.com/file/d/abc/view").valid, true);
    assert.equal(isAllowedDocumentUrl("https://127.0.0.1/secret.png").valid, false);
    assert.equal(isAllowedDocumentUrl("https://user:pass@drive.google.com/file").valid, false);
    assert.equal(isAllowedDocumentUrl("https://drive.google.com:8443/file").valid, false);
    assert.equal(isAllowedDocumentUrl("https://drive.google.com/file with space").valid, false);

    const ownPhoto =
      "https://myproj.supabase.co/storage/v1/object/public/public_images/pendaftaran/abc/foto.webp";
    assert.equal(isAllowedDocumentUrl(ownPhoto, { allowOwnStorageImage: false }).valid, false);
    assert.equal(isAllowedDocumentUrl(ownPhoto, { allowOwnStorageImage: true }).valid, true);
  } finally {
    if (prevUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_URL = prevUrl;
    }
  }
});

// -----------------------------------------------------------------------------
// 4. Multi-Position Oprec & Multi-Competition Event Selection Validation
// -----------------------------------------------------------------------------
test("validateItemSelection enforces 1 position for Oprec and multi-selection for Event", () => {
  const items = [
    { id: "11111111-1111-1111-1111-111111111111", name: "Posisi A", quota: 5 },
    { id: "22222222-2222-2222-2222-222222222222", name: "Posisi B", quota: 3 },
  ];

  // Oprec: must choose exactly 1
  const oprecEmpty = validateItemSelection({
    agendaType: "volunteer",
    availableItems: items,
    requestedItemIds: [],
  });
  assert.equal(oprecEmpty.valid, false);

  const oprecMulti = validateItemSelection({
    agendaType: "volunteer",
    availableItems: items,
    requestedItemIds: [items[0].id, items[1].id],
  });
  assert.equal(oprecMulti.valid, false);

  const oprecOne = validateItemSelection({
    agendaType: "volunteer",
    availableItems: items,
    requestedItemIds: [items[0].id, items[0].id], // duplicates deduplicated
  });
  assert.deepEqual(oprecOne, { valid: true, selectedItemIds: [items[0].id] });

  // Event Lomba: multi-lomba allowed when allowMultipleItems = true
  const eventMulti = validateItemSelection({
    agendaType: "event",
    allowMultipleItems: true,
    availableItems: items,
    requestedItemIds: [items[0].id, items[1].id],
  });
  assert.deepEqual(eventMulti, {
    valid: true,
    selectedItemIds: [items[0].id, items[1].id],
  });

  // Event Lomba: multi-lomba blocked when allowMultipleItems = false
  const eventSingleOnly = validateItemSelection({
    agendaType: "event",
    allowMultipleItems: false,
    availableItems: items,
    requestedItemIds: [items[0].id, items[1].id],
  });
  assert.equal(eventSingleOnly.valid, false);

  // Unknown item ID rejected
  const invalidItem = validateItemSelection({
    agendaType: "event",
    allowMultipleItems: true,
    availableItems: items,
    requestedItemIds: ["99999999-9999-9999-9999-999999999999"],
  });
  assert.equal(invalidItem.valid, false);
});

// -----------------------------------------------------------------------------
// 5. Dynamic Form Responses Validation (including select & image fields)
// -----------------------------------------------------------------------------
test("validateRegistrationResponses validates required, select options, email, number, and image URLs", () => {
  const prevUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://myproj.supabase.co";

  try {
    const schema: DynamicFormField[] = [
      { id: "f_name", type: "text", label: "Nama", required: true },
      { id: "f_email", type: "email", label: "Email", required: true },
      { id: "f_nim", type: "number", label: "NIM", required: true },
      {
        id: "f_prodi",
        type: "select",
        label: "Prodi",
        required: true,
        options: ["Teknik Informatika", "Sistem Informasi"],
      },
      { id: "f_photo", type: "image", label: "Pas Foto", required: true },
    ];

    const validRes = validateRegistrationResponses(schema, {
      f_name: "Budi Santoso",
      f_email: "budi@student.tazkia.ac.id",
      f_nim: "202401001",
      f_prodi: "Teknik Informatika",
      f_photo:
        "https://myproj.supabase.co/storage/v1/object/public/public_images/pendaftaran/ag1/budi.webp",
    });
    assert.deepEqual(validRes, {
      valid: true,
      extractedPortofolioUrl:
        "https://myproj.supabase.co/storage/v1/object/public/public_images/pendaftaran/ag1/budi.webp",
    });

    // Reject option not in select list
    const badSelect = validateRegistrationResponses(schema, {
      f_name: "Budi",
      f_email: "budi@student.tazkia.ac.id",
      f_nim: "202401001",
      f_prodi: "Hacking Prodi",
      f_photo: "https://drive.google.com/file/d/abc/view",
    });
    assert.equal(badSelect.valid, false);

    // Reject unexpected field key
    const extraKey = validateRegistrationResponses(schema, {
      f_name: "Budi",
      f_email: "budi@student.tazkia.ac.id",
      f_nim: "202401001",
      f_prodi: "Sistem Informasi",
      f_photo: "https://drive.google.com/file/d/abc/view",
      injected_field: "hack",
    });
    assert.equal(extraKey.valid, false);
  } finally {
    if (prevUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_URL = prevUrl;
    }
  }
});

// -----------------------------------------------------------------------------
// 6. Quota Aggregation & Rejected Slot Reopening
// -----------------------------------------------------------------------------
test("aggregateAgendaItemsAndCounts excludes rejected applications from filled_count and frees slots", () => {
  const agendas: Partial<AgendaKegiatan>[] = [
    { id: "ag-1", title: "Oprec Panitia" },
    { id: "ag-2", title: "Event Tanpa Sub-Item" },
  ];

  const items: AgendaItem[] = [
    {
      id: "pos-a",
      agenda_id: "ag-1",
      name: "Posisi A",
      quota: 2,
      participant_type: "individu",
      sort_order: 0,
    },
    {
      id: "pos-b",
      agenda_id: "ag-1",
      name: "Posisi B",
      quota: 3,
      participant_type: "individu",
      sort_order: 1,
    },
  ];

  const apps = [
    { agenda_id: "ag-1", item_id: "pos-a", status: "accepted" },
    { agenda_id: "ag-1", item_id: "pos-a", status: "rejected" }, // rejected frees slot!
    { agenda_id: "ag-1", item_id: "pos-b", status: "accepted" },
    { agenda_id: "ag-1", item_id: "pos-b", status: null }, // legacy null counts as filled
    { agenda_id: "ag-2", item_id: null, status: "accepted" },
    { agenda_id: "ag-2", item_id: null, status: "rejected" },
  ];

  const enriched = aggregateAgendaItemsAndCounts(agendas, items, apps);

  const ag1Items = enriched[0].items || [];
  assert.equal(ag1Items[0].filled_count, 1); // 1 accepted (the 1 rejected does not consume quota)
  assert.equal(ag1Items[0].rejected_count, 1);
  assert.equal(ag1Items[1].filled_count, 2);
  assert.equal(ag1Items[1].rejected_count, 0);
  assert.equal(enriched[0].accepted_count, 3);

  assert.equal(enriched[1].items?.length, 0);
  assert.equal(enriched[1].accepted_count, 1);
});

// -----------------------------------------------------------------------------
// 7. Per-Competition / Per-Position Extra Fields Validation & Helpers
// -----------------------------------------------------------------------------
test("hasAnyFormQuestions and hasAnyImageField inspect both common schema and item extra_fields", () => {
  const textField: DynamicFormField = {
    id: "common_name",
    type: "text",
    label: "Nama",
    required: true,
  };
  const extraTextField: DynamicFormField = {
    id: "extra_team",
    type: "text",
    label: "Nama Tim",
    required: true,
  };
  const extraImageField: DynamicFormField = {
    id: "extra_photo",
    type: "image",
    label: "Foto Karya",
    required: true,
  };

  assert.equal(hasAnyFormQuestions([], []), false);
  assert.equal(hasAnyFormQuestions([], [{ extra_fields: [] }]), false);
  assert.equal(hasAnyFormQuestions([], [{ extra_fields: [extraTextField] }]), true);
  assert.equal(hasAnyImageField([], [{ extra_fields: [extraTextField] }]), false);
  assert.equal(hasAnyImageField([textField], [{ extra_fields: [extraImageField] }]), true);
});

test("validateMultiItemRegistrationResponses validates common + per-item extra fields and isolates responsesByItem", () => {
  const prevUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://myproj.supabase.co";

  try {
    const commonSchema: DynamicFormField[] = [
      { id: "c_name", type: "text", label: "Nama Ketua", required: true },
      { id: "c_nim", type: "number", label: "NIM", required: true },
    ];
    const itemA = {
      id: "lomba-uiux",
      name: "UI/UX Design",
      extra_fields: [
        { id: "extra_figma", type: "file" as const, label: "Link Figma", required: true },
      ],
    };
    const itemB = {
      id: "lomba-foto",
      name: "Fotografi",
      extra_fields: [
        { id: "extra_photo", type: "image" as const, label: "Karya Foto", required: true },
      ],
    };
    const itemUnselected = {
      id: "lomba-coding",
      name: "Web Dev",
      extra_fields: [
        { id: "extra_github", type: "file" as const, label: "Repo GitHub", required: true },
      ],
    };

    const photoUrl =
      "https://myproj.supabase.co/storage/v1/object/public/public_images/pendaftaran/evt1/karya.webp";

    // 1. Mixed common + multiple selected items isolates each item's responses
    const mixedValid = validateMultiItemRegistrationResponses({
      commonSchema,
      selectedItems: [itemA, itemB],
      responses: {
        c_name: "Alya Putri",
        c_nim: "202401002",
        extra_figma: "https://figma.com/file/abc123",
        extra_photo: photoUrl,
      },
    });

    assert.equal(mixedValid.valid, true);
    if (mixedValid.valid) {
      assert.deepEqual(mixedValid.responsesByItem[itemA.id], {
        c_name: "Alya Putri",
        c_nim: "202401002",
        extra_figma: "https://figma.com/file/abc123",
      });
      assert.deepEqual(mixedValid.responsesByItem[itemB.id], {
        c_name: "Alya Putri",
        c_nim: "202401002",
        extra_photo: photoUrl,
      });
      assert.equal(
        mixedValid.mergedFieldsForSummary.some((f) => f.label === "[UI/UX Design] Link Figma"),
        true
      );
      assert.equal(
        mixedValid.mergedFieldsForSummary.some((f) => f.label === "[Fotografi] Karya Foto"),
        true
      );
    }

    // 2. Reject missing required extra field on one selected item
    const missingExtra = validateMultiItemRegistrationResponses({
      commonSchema,
      selectedItems: [itemA, itemB],
      responses: {
        c_name: "Alya Putri",
        c_nim: "202401002",
        extra_figma: "https://figma.com/file/abc123",
        extra_photo: "",
      },
    });
    assert.equal(missingExtra.valid, false);

    // 3. Reject stale/injected key belonging to an unselected item
    const unselectedKey = validateMultiItemRegistrationResponses({
      commonSchema,
      selectedItems: [itemA],
      responses: {
        c_name: "Alya Putri",
        c_nim: "202401002",
        extra_figma: "https://figma.com/file/abc123",
        [itemUnselected.extra_fields[0].id]: "https://github.com/org/repo",
      },
    });
    assert.equal(unselectedKey.valid, false);

    // 4. 100% separate per-item form when commonSchema is empty
    const separateFormOnly = validateMultiItemRegistrationResponses({
      commonSchema: [],
      selectedItems: [itemA, itemB],
      responses: {
        extra_figma: "https://figma.com/file/xyz",
        extra_photo: photoUrl,
      },
    });
    assert.equal(separateFormOnly.valid, true);
    if (separateFormOnly.valid) {
      assert.deepEqual(separateFormOnly.responsesByItem[itemA.id], {
        extra_figma: "https://figma.com/file/xyz",
      });
      assert.deepEqual(separateFormOnly.responsesByItem[itemB.id], {
        extra_photo: photoUrl,
      });
    }
  } finally {
    if (prevUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_URL = prevUrl;
    }
  }
});

// -----------------------------------------------------------------------------
// 8. Slug Normalization, Quota Parsing & Readable Save Error Mapping
// -----------------------------------------------------------------------------
test("buildBaseAgendaSlug and parsePositiveQuota handle emojis, strings, and invalid numbers safely", () => {
  assert.equal(
    buildBaseAgendaSlug("📢 Open Volunteer PJ Lomba  Perayaan HUT STMIK Tazkia ke-3"),
    "open-volunteer-pj-lomba-perayaan-hut-stmik-tazkia-ke-3"
  );
  assert.equal(buildBaseAgendaSlug("Seminar Nasional", "custom-slug-2026"), "custom-slug-2026");
  assert.match(buildBaseAgendaSlug("📢🔥"), /^kegiatan-\d+$/);

  assert.equal(parsePositiveQuota(5), 5);
  assert.equal(parsePositiveQuota("12"), 12);
  assert.equal(parsePositiveQuota(3.9), 3);
  assert.equal(parsePositiveQuota(0), null);
  assert.equal(parsePositiveQuota(-2), null);
  assert.equal(parsePositiveQuota(""), null);
  assert.equal(parsePositiveQuota("abc"), null);
});

test("formatAgendaSaveErrorMessage converts raw Postgres/auth errors into clear Indonesian messages", () => {
  assert.match(
    formatAgendaSaveErrorMessage(
      new Error("Could not find the 'extra_fields' column of 'agenda_items' in the schema cache")
    ),
    /20261125150000_add_item_extra_fields\.sql/
  );
  assert.match(
    formatAgendaSaveErrorMessage(
      new Error("Could not find the 'allow_multiple_items' column of 'agendas' in the schema cache")
    ),
    /20261125131500_multi_item_agenda_and_status\.sql/
  );
  assert.match(
    formatAgendaSaveErrorMessage({ code: "23505", message: "duplicate key value violates unique constraint" }),
    /bentrok/i
  );
  assert.match(
    formatAgendaSaveErrorMessage(new Error("Unauthorized: Sesi tidak valid")),
    /Sesi admin/i
  );
});

// -----------------------------------------------------------------------------
// 9. Deadline Timestamp & Closing Hour (WIB / Asia/Jakarta)
// -----------------------------------------------------------------------------
test("splitDeadlineWib and combineDeadlineWib round-trip dates and closing hours including 07:00 WIB", () => {
  assert.deepEqual(splitDeadlineWib(null), { date: "", time: "23:59" });
  assert.deepEqual(splitDeadlineWib("2026-11-27"), { date: "2026-11-27", time: "23:59" });

  const combined17 = combineDeadlineWib("2026-11-27", "17:00");
  assert.equal(combined17, "2026-11-27T17:00:00+07:00");
  assert.deepEqual(splitDeadlineWib(combined17), { date: "2026-11-27", time: "17:00" });

  // 07:00 WIB === 00:00:00Z must NOT be confused with a legacy midnight date
  const combined07 = combineDeadlineWib("2026-11-27", "07:00");
  assert.equal(combined07, "2026-11-27T07:00:00+07:00");
  assert.deepEqual(splitDeadlineWib("2026-11-27T00:00:00+00:00"), {
    date: "2026-11-27",
    time: "07:00",
  });

  const combined2359 = combineDeadlineWib("2026-11-27", "23:59");
  assert.equal(combined2359, "2026-11-27T23:59:59+07:00");
  assert.equal(parseDeadlineInstant("2026-11-27")?.toISOString(), "2026-11-27T16:59:59.000Z");
});

test("isDeadlinePassedJakarta respects exact WIB closing hour down to the minute", () => {
  const deadline17Wib = "2026-11-25T17:00:00+07:00"; // 10:00:00 UTC
  const beforeClose = new Date("2026-11-25T09:59:59.000Z"); // 16:59:59 WIB
  const afterClose = new Date("2026-11-25T10:00:01.000Z"); // 17:00:01 WIB

  assert.equal(isDeadlinePassedJakarta(deadline17Wib, beforeClose), false);
  assert.equal(isDeadlinePassedJakarta(deadline17Wib, afterClose), true);
});
