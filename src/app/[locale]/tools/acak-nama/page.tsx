import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import AcakNamaClient from "./AcakNamaClient";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Spinner' });
  
  const title = t('title') || "Alat Acak Nama & Kelompok";
  const desc = "Alat acak nama dan pembagi kelompok online gratis dari BEM STMIK Tazkia. Mudah digunakan, adil, dan interaktif.";
  
  return {
    title: `${title} | BEM STMIK Tazkia`,
    description: desc,
    keywords: ["Alat acak nama", "Spinner nama", "Wheel of names", "Bagi kelompok online", "BEM STMIK Tazkia randomizer", "Spin wheel"],
    openGraph: {
      title: `${title} | BEM STMIK Tazkia`,
      description: desc,
      url: `https://bem.stmik.tazkia.ac.id/${locale}/tools/acak-nama`,
      siteName: "BEM STMIK Tazkia",
      images: [
        {
          url: "/images/logo2.webp",
          width: 1200,
          height: 630,
          alt: "Alat Acak BEM STMIK Tazkia",
        }
      ],
      locale: locale === 'id' ? 'id_ID' : 'en_US',
      type: "website",
    }
  };
}

export default function AcakNamaPage() {
  return <AcakNamaClient />;
}
