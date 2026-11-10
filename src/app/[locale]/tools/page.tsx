import { Metadata } from "next";
import ToolsClient from "./ToolsClient";
import { getAlternates } from "@/utils/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const isId = locale === "id";
  const title = isId
    ? "Pusat Tools & Mini Games Mahasiswa | BEM STMIK Tazkia"
    : "Student Tools & Mini Games Hub | BEM STMIK Tazkia";
  const description = isId
    ? "Kumpulan tools utilitas dan mini games interaktif gratis dari BEM STMIK Tazkia. Mulai dari alat acak nama, kalkulator IPK, pomodoro timer, kuis kampus, hingga game seru."
    : "Collection of free interactive student utilities and mini-games from BEM STMIK Tazkia. Randomizer wheel, GPA calculator, pomodoro timer, campus trivia, and fun games.";

  return {
    title,
    description,
    keywords: [
      "Tools mahasiswa",
      "Mini games online",
      "Alat acak nama",
      "Spinner nama kelompok",
      "Kalkulator IPK online",
      "Pomodoro timer belajar",
      "Game kampus",
      "BEM STMIK Tazkia",
      "Web tools edukasi",
    ],
    openGraph: {
      title,
      description,
      url: `https://bem.stmik.tazkia.ac.id/${locale}/tools`,
      siteName: "BEM STMIK Tazkia",
      images: [
        {
          url: "/images/logo2.webp",
          width: 1200,
          height: 630,
          alt: "Tools & Mini Games BEM STMIK Tazkia",
        },
      ],
      locale: isId ? "id_ID" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/images/logo2.webp"],
    },
    alternates: getAlternates("/tools", locale),
  };
}

export default function ToolsHubPage() {
  return <ToolsClient />;
}

