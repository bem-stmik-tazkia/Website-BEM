const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, "../src/app/[locale]/dashboard/profile/page.tsx");
let content = fs.readFileSync(pagePath, "utf8");

if (!content.includes('const t = useTranslations("ProfileForm");')) {
  // Add imports
  content = content.replace(
    'import { useRouter } from "@/i18n/routing";',
    'import { useRouter } from "@/i18n/routing";\nimport { useTranslations } from "next-intl";'
  );

  content = content.replace(
    'export default function ProfileSettingsPage() {',
    'export default function ProfileSettingsPage() {\n  const t = useTranslations("ProfileForm");'
  );

  // Hard replacements for header
  content = content.replace('Pengaturan Profil', '{t("pageTitle")}');
  content = content.replace('Perbarui informasi publik dan kelola tautan portofolio Anda.', '{t("pageSubtitle")}');
  
  // Basic Info
  content = content.replace('Informasi Dasar', '{t("basicInfo")}');
  content = content.replace('Biodata utama yang akan tampil di halaman karya.', '{t("basicInfoDesc")}');
  content = content.replace('Nama Lengkap', '{t("fullName")}');
  content = content.replace('Program Studi', '{t("studyProgram")}');
  content = content.replace('Angkatan', '{t("cohort")}');
  content = content.replace('Email Kontak (Opsional)', '{t("contactEmail")}');
  content = content.replace('Email publik untuk kolaborasi atau rekrutmen.', '{t("contactEmailDesc")}');
  content = content.replace('Bio Singkat', '{t("bio")}');
  content = content.replace('"Ceritakan sedikit tentang minat dan fokus utamamu..."', '{t("bioPlaceholder")}');
  
  // Status & Skills
  content = content.replace('Status & Keahlian', '{t("statusSkills")}');
  content = content.replace('Tunjukkan kesediaan dan kemampuan terbaikmu.', '{t("statusSkillsDesc")}');
  content = content.replace('Status Saat Ini', '{t("currentStatus")}');
  content = content.replace('Pilih Status...', '{t("selectStatus")}');
  content = content.replace('Keahlian Utama', '{t("skills")}');
  content = content.replace('Maksimal 5 keahlian (contoh: Frontend, UI/UX, dll).', '{t("skillsDesc")}');
  content = content.replace('Pilih Keahlian...', '{t("selectSkill")}');
  content = content.replace('+ Tambah Custom Skill', '{t("addCustomSkill")}');
  content = content.replace('"Ketik skill lalu Enter..."', '{t("customSkillInput")}');
  content = content.replace('Tambah', '{t("addBtn")}');
  
  // Social Links
  content = content.replace('Tautan Sosial & Portofolio', '{t("socialLinks")}');
  content = content.replace('Tambahkan link ke profil profesional dan karyamu.', '{t("socialLinksDesc")}');
  content = content.replace('Website Pribadi / Portofolio', '{t("websiteUrl")}');
  
  // Alert
  content = content.replace('Data Program Studi dan Angkatan Anda telah dikunci oleh Admin Akademik. Hubungi Admin jika terdapat ketidaksesuaian data.', '{t("alertAdmin")}');
  
  // Buttons
  content = content.replace('Pilih Foto Baru', '{t("uploadAvatarBtn")}');
  content = content.replace('Menyimpan...', '{t("btnSaving")}');
  content = content.replace('Simpan Perubahan', '{t("btnSave")}');
  content = content.replace('Mengunggah...', '{t("uploading")}');

  // Toasts
  content = content.replace('"Profil berhasil diperbarui!"', 't("toastSuccess")');
  content = content.replace('"Gagal menyimpan profil. Silakan coba lagi."', 't("toastError")');
  content = content.replace('"Gagal mengunggah foto. Pastikan ukuran file di bawah 5MB."', 't("toastUploadError")');

  fs.writeFileSync(pagePath, content, "utf8");
  console.log("Updated ProfileSettingsPage with useTranslations");
}
