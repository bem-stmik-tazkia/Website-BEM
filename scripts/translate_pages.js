const fs = require('fs');
const path = require('path');

const locales = ['id', 'en', 'ar', 'ja', 'fr'];
const localesDir = path.join(__dirname, "../messages");

const translations = {
  id: {
    LandingPage: {
      title: "BEM STMIK Tazkia | Beranda",
      desc: "Selamat datang di portal resmi BEM STMIK Tazkia. Satu langkah untuk STMIK Tazkia berdampak."
    },
    ProfileForm: {
      pageTitle: "Pengaturan Profil",
      pageSubtitle: "Perbarui informasi publik dan kelola tautan portofolio Anda.",
      btnSave: "Simpan Perubahan",
      btnSaving: "Menyimpan...",
      basicInfo: "Informasi Dasar",
      basicInfoDesc: "Biodata utama yang akan tampil di halaman karya.",
      fullName: "Nama Lengkap",
      studyProgram: "Program Studi",
      cohort: "Angkatan",
      contactEmail: "Email Kontak (Opsional)",
      contactEmailDesc: "Email publik untuk kolaborasi atau rekrutmen.",
      bio: "Bio Singkat",
      bioPlaceholder: "Ceritakan sedikit tentang minat dan fokus utamamu...",
      statusSkills: "Status & Keahlian",
      statusSkillsDesc: "Tunjukkan kesediaan dan kemampuan terbaikmu.",
      currentStatus: "Status Saat Ini",
      selectStatus: "Pilih Status...",
      skills: "Keahlian Utama",
      skillsDesc: "Maksimal 5 keahlian (contoh: Frontend, UI/UX, dll).",
      selectSkill: "Pilih Keahlian...",
      addCustomSkill: "+ Tambah Custom Skill",
      customSkillInput: "Ketik skill lalu Enter...",
      addBtn: "Tambah",
      socialLinks: "Tautan Sosial & Portofolio",
      socialLinksDesc: "Tambahkan link ke profil profesional dan karyamu.",
      websiteUrl: "Website Pribadi / Portofolio",
      alertAdmin: "Data Program Studi dan Angkatan Anda telah dikunci oleh Admin Akademik. Hubungi Admin jika terdapat ketidaksesuaian data.",
      uploadAvatarBtn: "Pilih Foto Baru",
      uploading: "Mengunggah...",
      toastSuccess: "Profil berhasil diperbarui!",
      toastError: "Gagal menyimpan profil. Silakan coba lagi.",
      toastUploadError: "Gagal mengunggah foto. Pastikan ukuran file di bawah 5MB."
    }
  },
  en: {
    LandingPage: {
      title: "BEM STMIK Tazkia | Home",
      desc: "Welcome to the official portal of BEM STMIK Tazkia. One step for an impactful STMIK Tazkia."
    },
    ProfileForm: {
      pageTitle: "Profile Settings",
      pageSubtitle: "Update your public information and manage portfolio links.",
      btnSave: "Save Changes",
      btnSaving: "Saving...",
      basicInfo: "Basic Information",
      basicInfoDesc: "Main bio that will appear on the project page.",
      fullName: "Full Name",
      studyProgram: "Study Program",
      cohort: "Cohort",
      contactEmail: "Contact Email (Optional)",
      contactEmailDesc: "Public email for collaboration or recruitment.",
      bio: "Short Bio",
      bioPlaceholder: "Tell us a bit about your interests and main focus...",
      statusSkills: "Status & Skills",
      statusSkillsDesc: "Show your availability and best skills.",
      currentStatus: "Current Status",
      selectStatus: "Select Status...",
      skills: "Main Skills",
      skillsDesc: "Maximum 5 skills (e.g. Frontend, UI/UX, etc).",
      selectSkill: "Select Skill...",
      addCustomSkill: "+ Add Custom Skill",
      customSkillInput: "Type skill and press Enter...",
      addBtn: "Add",
      socialLinks: "Social & Portfolio Links",
      socialLinksDesc: "Add links to your professional profile and works.",
      websiteUrl: "Personal Website / Portfolio",
      alertAdmin: "Your Study Program and Cohort data have been locked by the Academic Admin. Contact Admin if there is a data discrepancy.",
      uploadAvatarBtn: "Choose New Photo",
      uploading: "Uploading...",
      toastSuccess: "Profile updated successfully!",
      toastError: "Failed to save profile. Please try again.",
      toastUploadError: "Failed to upload photo. Ensure file size is under 5MB."
    }
  },
  ar: {
    LandingPage: {
      title: "BEM STMIK Tazkia | الرئيسية",
      desc: "مرحبًا بك في البوابة الرسمية. خطوة واحدة من أجل تأثير حقيقي."
    },
    ProfileForm: {
      pageTitle: "إعدادات الملف الشخصي",
      pageSubtitle: "قم بتحديث معلوماتك العامة وإدارة روابط سيرتك الذاتية.",
      btnSave: "حفظ التغييرات",
      btnSaving: "جاري الحفظ...",
      basicInfo: "المعلومات الأساسية",
      basicInfoDesc: "السيرة الذاتية الرئيسية التي ستظهر في صفحة المشروع.",
      fullName: "الاسم الكامل",
      studyProgram: "البرنامج الدراسي",
      cohort: "الدفعة",
      contactEmail: "البريد الإلكتروني للاتصال (اختياري)",
      contactEmailDesc: "البريد الإلكتروني العام للتعاون أو التوظيف.",
      bio: "نبذة مختصرة",
      bioPlaceholder: "أخبرنا قليلاً عن اهتماماتك وتركيزك الرئيسي...",
      statusSkills: "الحالة والمهارات",
      statusSkillsDesc: "أظهر مدى توفرك وأفضل مهاراتك.",
      currentStatus: "الحالة الحالية",
      selectStatus: "اختر الحالة...",
      skills: "المهارات الرئيسية",
      skillsDesc: "بحد أقصى 5 مهارات.",
      selectSkill: "اختر المهارة...",
      addCustomSkill: "+ إضافة مهارة مخصصة",
      customSkillInput: "اكتب المهارة ثم اضغط Enter...",
      addBtn: "إضافة",
      socialLinks: "الروابط الاجتماعية ومحفظة الأعمال",
      socialLinksDesc: "أضف روابط إلى ملفك المهني وأعمالك.",
      websiteUrl: "الموقع الشخصي / محفظة الأعمال",
      alertAdmin: "تم قفل بيانات برنامجك الدراسي والدفعة من قبل المسؤول الأكاديمي. اتصل بالمسؤول في حال وجود اختلاف في البيانات.",
      uploadAvatarBtn: "اختر صورة جديدة",
      uploading: "جاري الرفع...",
      toastSuccess: "تم تحديث الملف الشخصي بنجاح!",
      toastError: "فشل حفظ الملف الشخصي. يرجى المحاولة مرة أخرى.",
      toastUploadError: "فشل رفع الصورة. تأكد من أن حجم الملف أقل من 5 ميغابايت."
    }
  },
  ja: {
    LandingPage: {
      title: "BEM STMIK Tazkia | ホーム",
      desc: "BEM STMIK Tazkiaの公式ポータルへようこそ。影響力のある大学へ向けての一歩。"
    },
    ProfileForm: {
      pageTitle: "プロフィール設定",
      pageSubtitle: "公開情報を更新し、ポートフォリオリンクを管理します。",
      btnSave: "変更を保存",
      btnSaving: "保存中...",
      basicInfo: "基本情報",
      basicInfoDesc: "プロジェクトページに表示される主な経歴。",
      fullName: "フルネーム",
      studyProgram: "学習プログラム",
      cohort: "コホート（入学年度）",
      contactEmail: "連絡先メール（任意）",
      contactEmailDesc: "コラボレーションや採用のための公開メール。",
      bio: "短い自己紹介",
      bioPlaceholder: "あなたの興味や主な専門分野について少し教えてください...",
      statusSkills: "ステータスとスキル",
      statusSkillsDesc: "あなたの空き状況と最高のスキルを示します。",
      currentStatus: "現在のステータス",
      selectStatus: "ステータスを選択...",
      skills: "主なスキル",
      skillsDesc: "最大5つのスキル（例：フロントエンド、UI/UXなど）。",
      selectSkill: "スキルを選択...",
      addCustomSkill: "+ カスタムスキルを追加",
      customSkillInput: "スキルを入力してEnter...",
      addBtn: "追加",
      socialLinks: "ソーシャル＆ポートフォリオリンク",
      socialLinksDesc: "プロフェッショナルなプロフィールや作品へのリンクを追加します。",
      websiteUrl: "個人のウェブサイト/ポートフォリオ",
      alertAdmin: "学習プログラムとコホートデータはアカデミック管理者によってロックされています。データの不一致がある場合は管理者に連絡してください。",
      uploadAvatarBtn: "新しい写真を選択",
      uploading: "アップロード中...",
      toastSuccess: "プロフィールが正常に更新されました！",
      toastError: "プロフィールの保存に失敗しました。もう一度お試しください。",
      toastUploadError: "写真のアップロードに失敗しました。ファイルサイズが5MB未満であることを確認してください。"
    }
  },
  fr: {
    LandingPage: {
      title: "BEM STMIK Tazkia | Accueil",
      desc: "Bienvenue sur le portail officiel de BEM STMIK Tazkia. Une étape pour un impact réel."
    },
    ProfileForm: {
      pageTitle: "Paramètres du Profil",
      pageSubtitle: "Mettez à jour vos informations publiques et gérez vos liens de portfolio.",
      btnSave: "Enregistrer",
      btnSaving: "Enregistrement...",
      basicInfo: "Informations de Base",
      basicInfoDesc: "Biographie principale qui apparaîtra sur la page du projet.",
      fullName: "Nom Complet",
      studyProgram: "Programme d'Études",
      cohort: "Cohorte",
      contactEmail: "Email de Contact (Facultatif)",
      contactEmailDesc: "Email public pour la collaboration ou le recrutement.",
      bio: "Courte Bio",
      bioPlaceholder: "Parlez-nous un peu de vos intérêts et de votre domaine de concentration...",
      statusSkills: "Statut et Compétences",
      statusSkillsDesc: "Montrez votre disponibilité et vos meilleures compétences.",
      currentStatus: "Statut Actuel",
      selectStatus: "Sélectionner le Statut...",
      skills: "Compétences Principales",
      skillsDesc: "Maximum 5 compétences (ex. Frontend, UI/UX, etc).",
      selectSkill: "Sélectionner une Compétence...",
      addCustomSkill: "+ Ajouter une Compétence",
      customSkillInput: "Tapez et appuyez sur Entrée...",
      addBtn: "Ajouter",
      socialLinks: "Liens Sociaux & Portfolio",
      socialLinksDesc: "Ajoutez des liens vers votre profil professionnel et vos projets.",
      websiteUrl: "Site Personnel / Portfolio",
      alertAdmin: "Vos données de programme d'études et de cohorte ont été verrouillées par l'administration. Contactez l'administrateur en cas de divergence de données.",
      uploadAvatarBtn: "Choisir une Nouvelle Photo",
      uploading: "Téléchargement...",
      toastSuccess: "Profil mis à jour avec succès !",
      toastError: "Échec de l'enregistrement du profil. Veuillez réessayer.",
      toastUploadError: "Échec du téléchargement. Assurez-vous que le fichier fait moins de 5 Mo."
    }
  }
};

locales.forEach(locale => {
  const filePath = path.join(localesDir, `${locale}.json`);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!data.LandingPage) {
      data.LandingPage = translations[locale].LandingPage;
    }
    if (!data.ProfileForm) {
      data.ProfileForm = translations[locale].ProfileForm;
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Updated ${locale}.json`);
  }
});

// Update src/app/[locale]/page.tsx
const pagePath = path.join(__dirname, "../src/app/[locale]/page.tsx");
let pageContent = fs.readFileSync(pagePath, "utf8");
if (!pageContent.includes("generateMetadata")) {
  pageContent = pageContent.replace('import { Metadata } from "next";', 'import { Metadata } from "next";\nimport { getTranslations } from "next-intl/server";');
  pageContent = pageContent.replace(
    /export const metadata: Metadata = {[\s\S]*?};\n/,
    `export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'LandingPage' });
  return {
    title: t('title'),
    description: t('desc'),
  };
}\n`
  );
  fs.writeFileSync(pagePath, pageContent, "utf8");
}
