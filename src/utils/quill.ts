/**
 * Utility untuk memproses dan menormalisasi HTML dari editor Quill
 * agar aman, rapi, dan konsisten di seluruh halaman aplikasi.
 */

export function processQuillHtml(html: string): string {
  if (!html) return "";
  return html
    // 1. Ganti semua non-breaking space (&nbsp; dan \u00A0) menjadi spasi normal
    // agar kata tidak terpotong acak di tengah kata
    .replace(/&nbsp;/g, " ")
    .replace(/\u00A0/g, " ")
    // 2. Normalisasi paragraf kosong
    .replace(/<p>\s*(<br\s*\/?>)?\s*<\/p>/gi, "<p><br /></p>")
    // 3. Konversi class alignment Quill ke inline style
    .replace(/class="ql-align-center"/g, 'style="text-align:center"')
    .replace(/class="ql-align-right"/g, 'style="text-align:right"')
    .replace(/class="ql-align-justify"/g, 'style="text-align:justify"')
    .replace(/class="ql-align-left"/g, 'style="text-align:left"');
}

/**
 * Cek apakah teks berisi tag HTML (misalnya dari Quill atau WYSIWYG editor)
 */
export function isHtmlContent(str?: string | null): boolean {
  if (!str) return false;
  return /<[a-z][\s\S]*>/i.test(str);
}
