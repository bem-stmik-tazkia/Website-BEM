const fs = require("fs");
const path = require("path");

const target = path.join(__dirname, "../src/app/[locale]/dashboard/edit/[id]/page.tsx");
let content = fs.readFileSync(target, "utf8");

// 1. Add imports
if (!content.includes('import LanguageSwitcher')) {
  content = content.replace(
    'import { useParams } from "next/navigation";',
    'import { useParams } from "next/navigation";\nimport { useTranslations } from "next-intl";\nimport LanguageSwitcher from "@/components/layout/LanguageSwitcher";'
  );
}

// 2. Add t() hook inside component
if (!content.includes('const t = useTranslations("EditForm");')) {
  content = content.replace(
    'export default function EditKaryaPage() {',
    'export default function EditKaryaPage() {\n  const t = useTranslations("EditForm");'
  );
}

// 3. Update top section texts
content = content.replace(
  '<FiArrowLeft size={16} /> Kembali',
  '<FiArrowLeft size={16} /> {t("back")}'
);
content = content.replace(
  '<h1 className="text-3xl font-extrabold text-[var(--color-primary)] mb-2">Edit Karya</h1>',
  '<h1 className="text-3xl font-extrabold text-[var(--color-primary)] mb-2">{t("title")}</h1>'
);
content = content.replace(
  'Perbarui data karyamu. Karya yang diedit akan kembali berstatus <strong>Menunggu Review</strong>.',
  '{t("subtitle")}'
);
content = content.replace(
  '<p className="text-on-surface-variant">Memuat data karya...</p>',
  '<p className="text-on-surface-variant">{t("loading")}</p>'
);

// 4. Update Toast Error Messages
content = content.replace('"Gagal memuat data karya"', 't("toastLoadError")');
content = content.replace('"Draft tersimpan dimuat ulang."', 't("toastDraftLoaded")');
content = content.replace('"Tidak ada perubahan yang dilakukan."', 't("toastNoChanges")');
content = content.replace('"Anda harus login untuk mengedit karya."', 't("toastLogin")');
content = content.replace('"Karya berhasil diperbarui! Silakan tunggu review ulang dari BEM."', 't("toastSuccess")');
content = content.replace('"Terjadi kesalahan saat menyimpan karya."', 't("toastError")');

content = content.replace('Foto Utama Karya', '{t("mainPhoto")}');
content = content.replace('Format: JPG/PNG, maksimal 2MB. Akan digunakan sebagai cover karya.', '{t("photoFormat")}');
content = content.replace('Informasi Utama', '{t("mainInfo")}');

// 5. Titles and Inputs
content = content.replace(
  '<label className={labelClass}>Judul Karya <span className="text-red-400">*</span></label>\n                <input id="input-title" name="title" type="text" value={formData.title} onChange={handleInput} placeholder="Contoh: Smart Campus Navigation System" className={getInputClass("input-title")} />',
  `<div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-semibold text-on-surface">{t("workTitle")} <span className="text-red-400">*</span></label>
                  <span className={\`text-xs font-medium \${formData.title.length >= 100 ? 'text-red-500' : 'text-on-surface-variant'}\`}>{formData.title.length}/100</span>
                </div>
                <input id="input-title" name="title" type="text" maxLength={100} value={formData.title} onChange={handleInput} placeholder="Contoh: Smart Campus Navigation System" className={getInputClass("input-title")} />`
);
content = content.replace('<label className={labelClass}>Kategori</label>', '<label className={labelClass}>{t("category")}</label>');

content = content.replace(
  '<label className={labelClass}>Deskripsi / Abstrak <span className="text-red-400">*</span></label>\n                <textarea id="input-description" name="description" rows={4} value={formData.description} onChange={handleInput} placeholder="Jelaskan latar belakang, tujuan, dan hasil dari proyekmu..." className={`${getInputClass("input-description")} resize-none`} />',
  `<div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-semibold text-on-surface">{t("description")} <span className="text-red-400">*</span></label>
                  <span className={\`text-xs font-medium \${formData.description.length >= 500 ? 'text-red-500' : 'text-on-surface-variant'}\`}>{formData.description.length}/500</span>
                </div>
                <textarea id="input-description" name="description" rows={4} maxLength={500} value={formData.description} onChange={handleInput} placeholder="..." className={\`\${getInputClass("input-description")} resize-none\`} />`
);

content = content.replace('Tech Stack & Tautan', '{formData.category === "Research" ? t("sectionTechKTI") : formData.category === "IoT" ? t("sectionTechIoT") : formData.category === "Multimedia" ? t("sectionTechLainnya") : t("sectionTechDefault")}');
content = content.replace('{formData.category === "Research" ? "Tools & Metodologi" : formData.category === "IoT" ? "Komponen Hardware & Software" : "Tech Stack"}', '{formData.category === "Research" ? t("techKTI") : formData.category === "IoT" ? t("techIoT") : formData.category === "Multimedia" ? t("techLainnya") : t("techDefault")}');
content = content.replace('GitHub Repository', '{t("githubUrl")}');
content = content.replace('Live Demo / Link Karya', '{formData.category === "Research" ? t("urlKTI") : formData.category === "Programming" ? t("urlProg") : formData.category === "IoT" ? t("urlIoT") : formData.category === "Multimedia" ? t("urlLainnya") : t("urlDefault")}');

content = content.replace('Fitur Utama', '{formData.category === "Research" ? t("featKTI") : formData.category === "Multimedia" ? t("featLainnya") : formData.category === "IoT" ? t("featIoT") : t("featDefault")}');
content = content.replace('Tambah Fitur', '{formData.category === "Research" ? t("addPoint") : formData.category === "Multimedia" ? t("addDetail") : t("addFeature")}');
content = content.replace('Fitur {i + 1}', '{formData.category === "Research" ? t("point") : formData.category === "Multimedia" ? t("detail") : t("feature")} {i + 1}');

content = content.replace('Anggota Tim', '{t("team")}');
content = content.replace('Tambah Anggota', '{t("addMember")}');
content = content.replace('Project Lead', '{t("projectLead")}');
content = content.replace('Anggota ${i + 1}', '{t("member")} ${i + 1}');

content = content.replace('Galeri / Proses Pembuatan', '{t("gallery")}');
content = content.replace('Unggah foto-foto tambahan terkait karya ini.', '{t("galleryDesc")}');
content = content.replace('Tambah Foto', '{t("addPhoto")}');
content = content.replace('Foto {i + 1}', '{t("photo")} {i + 1}');
content = content.replace('Keterangan foto (misal: Tahap Wireframing)...', '{t("caption")}');
content = content.replace('Belum ada foto galeri.', '{t("emptyGallery")}');
content = content.replace('Tambah Foto Dokumentasi', '{t("addPhoto")}');

content = content.replace('Menyimpan Perubahan...', '{t("saving")}');
content = content.replace('Simpan Perubahan & Ajukan Review Ulang', '{t("submit")}');
content = content.replace('Perubahan Belum Disimpan', '{t("unsavedTitle")}');
content = content.replace('Apakah kamu yakin ingin keluar? Semua isian pada form ini akan hilang jika belum disimpan.', '{t("unsavedDesc")}');
content = content.replace('Batal', '{t("cancel")}');
content = content.replace('Ya, Keluar', '{t("leave")}');
content = content.replace('Nama Lengkap', '{t("namePlaceholder")}');
content = content.replace('placeholder="Peran"', 'placeholder={t("rolePlaceholder")}');


// Validation Error Replacements
content = content.replace('"Foto Utama Karya wajib diupload!"', 't("toastErrorFields")');
content = content.replace('"Judul Karya wajib diisi!"', 't("toastErrorFields")');
content = content.replace('"Kategori wajib dipilih!"', 't("toastErrorFields")');
content = content.replace('"Deskripsi/Abstrak wajib diisi!"', 't("toastErrorFields")');
content = content.replace('"Tech Stack wajib diisi!"', 't("toastErrorFields")');
content = content.replace('"Format GitHub URL tidak valid!"', 't("toastErrorFields")');
content = content.replace('"Live Demo / Link Karya wajib diisi!"', 't("toastErrorFields")');
content = content.replace('"Format Live Demo URL tidak valid!"', 't("toastErrorFields")');
content = content.replace('"Minimal 1 Fitur Utama harus diisi (Judul & Deskripsi)!"', 't("toastErrorFields")');
content = content.replace('"Minimal 1 Anggota Tim harus diisi (Nama & Peran)!"', 't("toastErrorFields")');
content = content.replace('"Minimal 1 Foto Dokumentasi wajib diupload!"', 't("toastErrorFields")');

// Language Switcher Append
if (!content.includes('<LanguageSwitcher />')) {
  content = content.replace(
    '</AnimatePresence>\n      </div>\n    </div>',
    `</AnimatePresence>\n      </div>\n      {/* Floating Language Switcher specifically for this page */}\n      <div className="fixed bottom-6 right-4 md:bottom-0 md:right-0 md:relative z-50">\n        <LanguageSwitcher />\n      </div>\n    </div>`
  );
}

fs.writeFileSync(target, content, "utf8");
console.log("Updated edit page!");
