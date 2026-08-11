const fs = require("fs");
const path = require("path");

const messagesDir = path.join(__dirname, "../messages");
const locales = ["ar", "en", "fr", "id", "ja"];

const newTranslations = {
  ar: {
    back: "عودة",
    title: "اختر نوع العمل",
    desc: "ما نوع الابتكار الذي ترغب في مشاركته اليوم؟ قم بالتمرير واختر إحدى الفئات أدناه.",
    catTechTitle: "تطبيقات الويب والنظام",
    catTechDesc: "موقع ويب، نظام معلومات، لوحة تحكم، صفحة هبوط.",
    catProgTitle: "تطبيقات الجوال",
    catProgDesc: "تطبيقات أندرويد، iOS، أو PWA (تطبيقات الويب التقدمية).",
    catResTitle: "الأبحاث والمقالات",
    catResDesc: "الأعمال العلمية المكتوبة، المجلات، الأوراق، البحوث.",
    catIotTitle: "مشاريع إنترنت الأشياء",
    catIotDesc: "إنترنت الأشياء، أردوينو، راسبيري باي، الروبوتات.",
    catMultiTitle: "التصميم وغيرها",
    catMultiDesc: "واجهة المستخدم/تجربة المستخدم، التصميم الجرافيكي، الفيديو، أو ابتكارات عامة أخرى.",
    startUpload: "بدء الرفع"
  },
  en: {
    back: "Back",
    title: "Choose Work Type",
    desc: "What kind of innovation do you want to share today? Swipe and select a category below.",
    catTechTitle: "Web & System Apps",
    catTechDesc: "Website, Information System, Dashboard, Landing Page.",
    catProgTitle: "Mobile Apps",
    catProgDesc: "Android, iOS, or PWA (Progressive Web App) applications.",
    catResTitle: "Research & Journals",
    catResDesc: "Scientific Papers, Journals, Articles, Research.",
    catIotTitle: "IoT Projects",
    catIotDesc: "Internet of Things, Arduino, Raspberry Pi, Robotics.",
    catMultiTitle: "Design & Others",
    catMultiDesc: "UI/UX, Graphic Design, Video, or other general innovations.",
    startUpload: "Start Upload"
  },
  fr: {
    back: "Retour",
    title: "Choisissez le type d'œuvre",
    desc: "Quel type d'innovation souhaitez-vous partager aujourd'hui ? Faites glisser et sélectionnez une catégorie ci-dessous.",
    catTechTitle: "Applications Web et Système",
    catTechDesc: "Site Web, Système d'Information, Tableau de Bord, Page de Destination.",
    catProgTitle: "Applications Mobiles",
    catProgDesc: "Applications Android, iOS ou PWA (Progressive Web App).",
    catResTitle: "Recherche et Journaux",
    catResDesc: "Articles Scientifiques, Journaux, Documents, Recherche.",
    catIotTitle: "Projets IoT",
    catIotDesc: "Internet des Objets, Arduino, Raspberry Pi, Robotique.",
    catMultiTitle: "Design et Autres",
    catMultiDesc: "UI/UX, Design Graphique, Vidéo ou autres innovations générales.",
    startUpload: "Commencer le Téléchargement"
  },
  id: {
    back: "Kembali",
    title: "Pilih Tipe Karya",
    desc: "Apa jenis inovasi yang ingin kamu bagikan hari ini? Geser dan pilih salah satu kategori di bawah.",
    catTechTitle: "Aplikasi Web & Sistem",
    catTechDesc: "Website, Sistem Informasi, Dashboard, Landing Page.",
    catProgTitle: "Aplikasi Mobile",
    catProgDesc: "Aplikasi Android, iOS, atau PWA (Progressive Web App).",
    catResTitle: "Karya Tulis & Jurnal",
    catResDesc: "Karya Tulis Ilmiah (KTI), Jurnal, Makalah, Penelitian.",
    catIotTitle: "Proyek IoT",
    catIotDesc: "Internet of Things, Arduino, Raspberry Pi, Robotika.",
    catMultiTitle: "Desain & Lainnya",
    catMultiDesc: "UI/UX, Desain Grafis, Video, atau Inovasi umum lainnya.",
    startUpload: "Mulai Upload"
  },
  ja: {
    back: "戻る",
    title: "作品タイプを選択",
    desc: "今日共有したいイノベーションは何ですか？スワイプして下のカテゴリから選択してください。",
    catTechTitle: "Web＆システムアプリ",
    catTechDesc: "ウェブサイト、情報システム、ダッシュボード、ランディングページ。",
    catProgTitle: "モバイルアプリ",
    catProgDesc: "Android、iOS、またはPWA（プログレッシブウェブアプリ）アプリケーション。",
    catResTitle: "研究＆ジャーナル",
    catResDesc: "科学論文、学術誌、レポート、研究。",
    catIotTitle: "IoTプロジェクト",
    catIotDesc: "モノのインターネット、Arduino、Raspberry Pi、ロボティクス。",
    catMultiTitle: "デザイン＆その他",
    catMultiDesc: "UI/UX、グラフィックデザイン、ビデオ、またはその他の一般的なイノベーション。",
    startUpload: "アップロードを開始"
  }
};

for (const locale of locales) {
  const filePath = path.join(messagesDir, `${locale}.json`);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    data.UploadKarya = newTranslations[locale];
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${locale}.json`);
  }
}
