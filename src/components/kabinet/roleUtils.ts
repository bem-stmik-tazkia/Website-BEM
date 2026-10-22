export const ROLE_TRANSLATIONS: Record<string, Record<string, string>> = {
  KetuaBEM: {
    id: "Ketua BEM",
    en: "BEM President",
    ar: "رئيس المجلس",
    fr: "Président du BEM",
    ja: "BEM会長",
  },
  WakilKetuaBEM: {
    id: "Wakil Ketua BEM",
    en: "BEM Vice President",
    ar: "نائب رئيس المجلس",
    fr: "Vice-Président du BEM",
    ja: "BEM副会長",
  },
  PresidenMahasiswa: {
    id: "Presiden Mahasiswa",
    en: "Student President",
    ar: "رئيس اتحاد الطلاب",
    fr: "Président des Étudiants",
    ja: "学生会長",
  },
  WakilPresidenMahasiswa: {
    id: "Wakil Presiden Mahasiswa",
    en: "Vice Student President",
    ar: "نائب رئيس اتحاد الطلاب",
    fr: "Vice-Président des Étudiants",
    ja: "学生副会長",
  },
  Sekretaris: {
    id: "Sekretaris",
    en: "Secretary",
    ar: "سكرتير",
    fr: "Secrétaire",
    ja: "秘書",
  },
  Sekretaris1: {
    id: "Sekretaris 1",
    en: "Secretary 1",
    ar: "سكرتير 1",
    fr: "Secrétaire 1",
    ja: "第1秘書",
  },
  Sekretaris2: {
    id: "Sekretaris 2",
    en: "Secretary 2",
    ar: "سكرتير 2",
    fr: "Secrétaire 2",
    ja: "第2秘書",
  },
  Bendahara: {
    id: "Bendahara",
    en: "Treasurer",
    ar: "أمين الصندوق",
    fr: "Trésorier",
    ja: "会計",
  },
  Bendahara1: {
    id: "Bendahara 1",
    en: "Treasurer 1",
    ar: "أمين الصندوق 1",
    fr: "Trésorier 1",
    ja: "第1会計",
  },
  Bendahara2: {
    id: "Bendahara 2",
    en: "Treasurer 2",
    ar: "أمين الصندوق 2",
    fr: "Trésorier 2",
    ja: "第2会計",
  },
  KepalaDepartemen: {
    id: "Kepala Departemen",
    en: "Head of Department",
    ar: "رئيس القسم",
    fr: "Chef de Département",
    ja: "部長",
  },
  WakilKepalaDepartemen: {
    id: "Wakil Kepala Departemen",
    en: "Vice Head of Department",
    ar: "نائب رئيس القسم",
    fr: "Vice-Chef de Département",
    ja: "副部長",
  },
  KetuaDepartemen: {
    id: "Ketua Departemen",
    en: "Head of Department",
    ar: "رئيس القسم",
    fr: "Chef de Département",
    ja: "部長",
  },
  WakilKetuaDepartemen: {
    id: "Wakil Ketua Departemen",
    en: "Vice Head of Department",
    ar: "نائب رئيس القسم",
    fr: "Vice-Chef de Département",
    ja: "副部長",
  },
  KetuaDivisi: {
    id: "Ketua Divisi",
    en: "Head of Division",
    ar: "رئيس الشعبة",
    fr: "Chef de Division",
    ja: "課長",
  },
  WakilKetuaDivisi: {
    id: "Wakil Ketua Divisi",
    en: "Vice Head of Division",
    ar: "نائب رئيس الشعبة",
    fr: "Vice-Chef de Division",
    ja: "副課長",
  },
  Ketua: {
    id: "Ketua",
    en: "Head",
    ar: "رئيس",
    fr: "Chef",
    ja: "リーダー",
  },
  WakilKetua: {
    id: "Wakil Ketua",
    en: "Vice Head",
    ar: "نائب رئيس",
    fr: "Vice-Chef",
    ja: "副リーダー",
  },
  Anggota: {
    id: "Anggota",
    en: "Member",
    ar: "عضو",
    fr: "Membre",
    ja: "メンバー",
  },
  Staff: {
    id: "Staff",
    en: "Staff",
    ar: "طاقم العمل",
    fr: "Personnel",
    ja: "スタッフ",
  },
  Staf: {
    id: "Staf",
    en: "Staff",
    ar: "طاقم العمل",
    fr: "Personnel",
    ja: "スタッフ",
  },
  Koordinator: {
    id: "Koordinator",
    en: "Coordinator",
    ar: "منسق",
    fr: "Coordinateur",
    ja: "コーディネーター",
  },
};

export const CABINET_LABEL: Record<string, string> = {
  id: "Kabinet",
  en: "Cabinet",
  ar: "مجلس وزراء",
  fr: "Cabinet",
  ja: "内閣",
};

export const MOTTO_LABEL: Record<string, string> = {
  id: "Sinergi, Integritas, dan Dedikasi Nyata untuk BEM STMIK Tazkia.",
  en: "Synergy, Integrity, and Real Dedication for BEM STMIK Tazkia.",
  ar: "التآزر والنزاهة والتفاني الحقيقي من أجل مجلس STMIK Tazkia.",
  fr: "Synergie, Intégrité et Dévouement Réel pour le BEM STMIK Tazkia.",
  ja: "BEM STMIK Tazkiaのための相乗効果、誠実さ、そして真の献身。",
};

export function getLocalizedRole(role?: string, locale = "id"): string {
  if (!role || typeof role !== "string" || !role.trim()) return "";
  const langKey = locale.slice(0, 2).toLowerCase();

  // If already Indonesian and looking for Indonesian, return cleanly
  if (langKey === "id") return role;

  // 1. Direct key match (e.g. "WakilKetuaBEM")
  const cleanKey = role.replace(/[\s\(\)-]/g, "");
  if (ROLE_TRANSLATIONS[cleanKey]?.[langKey]) {
    return ROLE_TRANSLATIONS[cleanKey][langKey];
  }

  // 2. Case-insensitive lookup
  const lowerKey = cleanKey.toLowerCase();
  for (const [k, v] of Object.entries(ROLE_TRANSLATIONS)) {
    if (k.toLowerCase() === lowerKey) {
      return v[langKey] || v["en"] || role;
    }
  }

  // 3. Pattern-based fallback
  const trimmed = role.trim();
  if (/^wakil\s*ketua\s*bem/i.test(trimmed)) {
    return ROLE_TRANSLATIONS.WakilKetuaBEM[langKey] || "BEM Vice President";
  }
  if (/^ketua\s*bem/i.test(trimmed)) {
    return ROLE_TRANSLATIONS.KetuaBEM[langKey] || "BEM President";
  }
  if (/^presiden\s*mahasiswa/i.test(trimmed)) {
    return ROLE_TRANSLATIONS.PresidenMahasiswa[langKey] || "Student President";
  }
  if (/^wakil\s*presiden\s*mahasiswa/i.test(trimmed)) {
    return ROLE_TRANSLATIONS.WakilPresidenMahasiswa[langKey] || "Vice Student President";
  }
  if (/^kepala\s*departemen/i.test(trimmed) || /^ketua\s*departemen/i.test(trimmed)) {
    return ROLE_TRANSLATIONS.KepalaDepartemen[langKey] || "Head of Department";
  }
  if (/^wakil\s*(?:kepala|ketua)\s*departemen/i.test(trimmed)) {
    return ROLE_TRANSLATIONS.WakilKepalaDepartemen[langKey] || "Vice Head of Department";
  }
  if (/^sekretaris\s*1/i.test(trimmed)) {
    return ROLE_TRANSLATIONS.Sekretaris1[langKey] || "Secretary 1";
  }
  if (/^sekretaris\s*2/i.test(trimmed)) {
    return ROLE_TRANSLATIONS.Sekretaris2[langKey] || "Secretary 2";
  }
  if (/^sekretaris/i.test(trimmed)) {
    return ROLE_TRANSLATIONS.Sekretaris[langKey] || "Secretary";
  }
  if (/^bendahara\s*1/i.test(trimmed)) {
    return ROLE_TRANSLATIONS.Bendahara1[langKey] || "Treasurer 1";
  }
  if (/^bendahara\s*2/i.test(trimmed)) {
    return ROLE_TRANSLATIONS.Bendahara2[langKey] || "Treasurer 2";
  }
  if (/^bendahara/i.test(trimmed)) {
    return ROLE_TRANSLATIONS.Bendahara[langKey] || "Treasurer";
  }
  if (/^wakil\s*ketua/i.test(trimmed)) {
    return ROLE_TRANSLATIONS.WakilKetua[langKey] || "Vice Head";
  }
  if (/^ketua/i.test(trimmed)) {
    return ROLE_TRANSLATIONS.Ketua[langKey] || "Head";
  }
  if (/^anggota/i.test(trimmed) || /^staf+/i.test(trimmed)) {
    return ROLE_TRANSLATIONS.Anggota[langKey] || "Member";
  }
  if (/^koordinator/i.test(trimmed)) {
    return ROLE_TRANSLATIONS.Koordinator[langKey] || "Coordinator";
  }

  return role;
}

export function getCabinetWord(locale = "id"): string {
  const langKey = locale.slice(0, 2).toLowerCase();
  return CABINET_LABEL[langKey] || CABINET_LABEL.en || "Cabinet";
}

export function getMottoQuote(locale = "id"): string {
  const langKey = locale.slice(0, 2).toLowerCase();
  return MOTTO_LABEL[langKey] || MOTTO_LABEL.en;
}

