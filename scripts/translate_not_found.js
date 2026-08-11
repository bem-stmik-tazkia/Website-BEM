const fs = require('fs');
const path = require('path');

const locales = ['id', 'en', 'ar', 'ja', 'fr'];
const localesDir = path.join(__dirname, "../messages");

// 1. Update JSON files
const translations = {
  id: {
    title: "Halaman Tidak Ditemukan",
    desc: "Maaf, halaman yang Anda cari tidak dapat ditemukan, telah dihapus, atau alamat URL yang Anda masukkan salah.",
    back: "Kembali",
    home: "Kembali ke Beranda"
  },
  en: {
    title: "Page Not Found",
    desc: "Sorry, the page you are looking for could not be found, has been removed, or the URL is incorrect.",
    back: "Go Back",
    home: "Back to Home"
  },
  ar: {
    title: "الصفحة غير موجودة",
    desc: "عذراً، الصفحة التي تبحث عنها غير موجودة أو تمت إزالتها أو أن عنوان URL غير صحيح.",
    back: "العودة",
    home: "العودة للصفحة الرئيسية"
  },
  ja: {
    title: "ページが見つかりません",
    desc: "申し訳ありませんが、お探しのページは見つからないか、削除されたか、URLが間違っています。",
    back: "戻る",
    home: "ホームへ戻る"
  },
  fr: {
    title: "Page Non Trouvée",
    desc: "Désolé, la page que vous recherchez est introuvable, a été supprimée ou l'URL est incorrecte.",
    back: "Retour",
    home: "Retour à l'accueil"
  }
};

locales.forEach(locale => {
  const filePath = path.join(localesDir, `${locale}.json`);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!data.NotFound) {
      data.NotFound = translations[locale];
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`Updated ${locale}.json`);
    }
  }
});

// 2. Update not-found.tsx
const notFoundPath = path.join(__dirname, "../src/app/[locale]/not-found.tsx");
let content = fs.readFileSync(notFoundPath, "utf8");

if (!content.includes('useTranslations("NotFound")')) {
  // Add import
  content = content.replace(
    'import { FiHome, FiArrowLeft } from "react-icons/fi";',
    'import { FiHome, FiArrowLeft } from "react-icons/fi";\nimport { useTranslations } from "next-intl";'
  );
  
  // Add hook
  content = content.replace(
    'export default function NotFound() {',
    'export default function NotFound() {\n  const t = useTranslations("NotFound");'
  );

  // Replace texts
  content = content.replace('Halaman Tidak Ditemukan', '{t("title")}');
  content = content.replace('Maaf, halaman yang Anda cari tidak dapat ditemukan, telah dihapus, atau alamat URL yang Anda masukkan salah.', '{t("desc")}');
  content = content.replace('<FiArrowLeft size={16} /> Kembali', '<FiArrowLeft size={16} /> {t("back")}');
  content = content.replace('<FiHome size={16} /> Kembali ke Beranda', '<FiHome size={16} /> {t("home")}');

  fs.writeFileSync(notFoundPath, content, "utf8");
  console.log("Updated not-found.tsx");
}
