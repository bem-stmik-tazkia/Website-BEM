import test from "node:test";
import assert from "node:assert/strict";
import {
  SITE_URL,
  buildBreadcrumbJsonLd,
  buildPageMetadata,
  getAlternates,
  getOgLocale,
  resolveValidOgImage,
  safeJsonLdStringify,
  stripHtmlAndMarkdown,
} from "../src/utils/seo";
import { DEFAULT_OG_RASTER_IMAGE } from "../src/lib/default-posters";
import robots from "../src/app/robots";

test("getAlternates generates canonical and hreflang URLs across all supported locales", () => {
  const alt = getAlternates("/berita/pengumuman-penting", "en");
  assert.equal(alt.canonical, `${SITE_URL}/en/berita/pengumuman-penting`);
  assert.equal(alt.languages.id, `${SITE_URL}/id/berita/pengumuman-penting`);
  assert.equal(alt.languages.en, `${SITE_URL}/en/berita/pengumuman-penting`);
  assert.equal(alt.languages.ar, `${SITE_URL}/ar/berita/pengumuman-penting`);
  assert.equal(alt.languages.ja, `${SITE_URL}/ja/berita/pengumuman-penting`);
  assert.equal(alt.languages.fr, `${SITE_URL}/fr/berita/pengumuman-penting`);
  assert.equal(alt.languages["x-default"], `${SITE_URL}/id/berita/pengumuman-penting`);
});

test("getOgLocale maps app locales to Open Graph locale codes", () => {
  assert.equal(getOgLocale("id"), "id_ID");
  assert.equal(getOgLocale("en"), "en_US");
  assert.equal(getOgLocale("ar"), "ar_AR");
  assert.equal(getOgLocale("ja"), "ja_JP");
  assert.equal(getOgLocale("fr"), "fr_FR");
  assert.equal(getOgLocale("unknown"), "id_ID");
});

test("stripHtmlAndMarkdown removes HTML tags, markdown tokens, and truncates safely", () => {
  const raw = "<p>Halo <strong>Mahasiswa</strong> &nbsp; #STMIK *Tazkia*!</p>";
  assert.equal(stripHtmlAndMarkdown(raw, 160), "Halo Mahasiswa STMIK Tazkia!");
  assert.equal(stripHtmlAndMarkdown("a".repeat(20), 10), "aaaaaaa...");
});

test("resolveValidOgImage falls back to 1200x630 raster banner for SVGs and empty paths", () => {
  assert.equal(DEFAULT_OG_RASTER_IMAGE, `${SITE_URL}/images/og-banner.png`);
  assert.equal(resolveValidOgImage(null), DEFAULT_OG_RASTER_IMAGE);
  assert.equal(resolveValidOgImage("/posters/default-event.svg"), DEFAULT_OG_RASTER_IMAGE);
  assert.equal(resolveValidOgImage("/posters/default-oprec.svg"), DEFAULT_OG_RASTER_IMAGE);
  assert.equal(
    resolveValidOgImage("https://drive.google.com/file/d/ABC123xyz/view"),
    "https://drive.google.com/thumbnail?id=ABC123xyz&sz=w1200"
  );
  assert.equal(
    resolveValidOgImage("/storage/public_images/berita/foto.webp"),
    `${SITE_URL}/storage/public_images/berita/foto.webp`
  );
});

test("buildPageMetadata creates complete OG, Twitter, alternates, and optional noindex", () => {
  const meta = buildPageMetadata({
    locale: "id",
    path: "/berita/test-slug",
    title: "Judul Test",
    description: "Deskripsi singkat",
    type: "article",
    publishedTime: "2026-11-27T00:00:00Z",
    noIndex: true,
  });

  assert.equal(meta.title, "Judul Test");
  assert.equal((meta.openGraph as any)?.url, `${SITE_URL}/id/berita/test-slug`);
  assert.equal((meta.openGraph as any)?.locale, "id_ID");
  assert.equal((meta.openGraph as any)?.images?.[0]?.width, 1200);
  assert.equal((meta.openGraph as any)?.images?.[0]?.height, 630);
  assert.deepEqual(meta.robots, { index: false, follow: false });
});

test("buildBreadcrumbJsonLd constructs schema.org BreadcrumbList items in order", () => {
  const ld = buildBreadcrumbJsonLd([
    { name: "Beranda", url: `${SITE_URL}/id` },
    { name: "Berita", url: `${SITE_URL}/id/berita` },
  ]);
  assert.equal(ld["@type"], "BreadcrumbList");
  assert.equal(ld.itemListElement.length, 2);
  assert.equal(ld.itemListElement[0].position, 1);
  assert.equal(ld.itemListElement[1].position, 2);
});

test("robots.ts disallows sensitive paths and storage buckets while leaving /sertifikat crawlable for noindex", () => {
  const config = robots();
  const rules = Array.isArray(config.rules) ? config.rules : [config.rules];
  const wildcard = rules.find((r) => r.userAgent === "*");
  const googlebot = rules.find((r) => r.userAgent === "Googlebot");

  assert.ok(wildcard && Array.isArray(wildcard.disallow));
  assert.ok(googlebot && Array.isArray(googlebot.disallow));

  for (const disallowed of [
    "/admin/",
    "/*/admin/",
    "/dashboard/",
    "/*/dashboard/",
    "/profil",
    "/*/profil",
    "/login",
    "/storage/pendaftaran/",
    "/storage/certificates/",
    "/storage/public_images/pendaftaran/",
    "/storage/public_images/certificates/",
    "/storage/*/pendaftaran/",
    "/storage/*/certificates/",
    "/*?*next=*",
  ]) {
    assert.ok(wildcard.disallow.includes(disallowed), `wildcard missing ${disallowed}`);
    assert.ok(googlebot.disallow.includes(disallowed), `googlebot missing ${disallowed}`);
  }

  assert.ok(!wildcard.disallow.includes("/sertifikat/"));
  assert.ok(!wildcard.disallow.includes("/*/sertifikat/"));
});

test("safeJsonLdStringify escapes <, >, and & to prevent script-tag breakout XSS", () => {
  const serialized = safeJsonLdStringify({
    headline: 'Test </script><script>alert("xss")</script> & More',
  });
  assert.ok(!serialized.includes("</script>"));
  assert.ok(!serialized.includes("<"));
  assert.ok(!serialized.includes(">"));
  assert.ok(serialized.includes("\\u003c/script\\u003e"));
  assert.ok(serialized.includes("\\u0026"));
});
