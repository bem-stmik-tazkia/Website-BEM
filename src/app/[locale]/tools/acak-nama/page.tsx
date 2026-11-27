import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import AcakNamaClient from "./AcakNamaClient";
import { buildPageMetadata } from "@/utils/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Spinner' });

  const title = t('title') || "Alat Acak Nama & Kelompok";
  const desc = "Alat acak nama dan pembagi kelompok online gratis dari BEM STMIK Tazkia. Mudah digunakan, adil, dan interaktif.";

  return buildPageMetadata({
    locale,
    path: "/tools/acak-nama",
    title: `${title} | BEM STMIK Tazkia`,
    description: desc,
    imageAlt: "Alat Acak Nama BEM STMIK Tazkia",
    keywords: ["Alat acak nama", "Spinner nama", "Wheel of names", "Bagi kelompok online", "BEM STMIK Tazkia randomizer", "Spin wheel"],
  });
}

export default function AcakNamaPage() {
  return <AcakNamaClient />;
}
