import { Metadata } from "next";
import PapanSkorClient from "./PapanSkorClient";
import { getAlternates } from "@/utils/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const isId = locale === "id";
  const title = isId
    ? "Papan Skor Digital Online (Scoreboard) | BEM STMIK Tazkia"
    : "Online Digital Scoreboard | BEM STMIK Tazkia";
  const description = isId
    ? "Papan skor digital online gratis dan responsif untuk pertandingan futsal, badminton, basket, kuis, atau e-sport kampus. Dilengkapi timer waktu, mode layar penuh (fullscreen), dan tombol tukar lapangan."
    : "Free online digital scoreboard for futsal, badminton, basketball, quizzes, and esports. Featuring match timers, full-screen projector mode, and side swap.";

  return {
    title,
    description,
    keywords: [
      "Papan skor online",
      "Digital scoreboard free",
      "Skor pertandingan futsal",
      "Papan skor badminton",
      "Skor basket online",
      "Scoreboard kuis kampus",
      "Timer pertandingan olahraga",
      "BEM STMIK Tazkia",
    ],
    openGraph: {
      title,
      description,
      url: `https://bem.stmik.tazkia.ac.id/${locale}/tools/papan-skor`,
      siteName: "BEM STMIK Tazkia",
      images: [
        {
          url: "/images/logo2.webp",
          width: 1200,
          height: 630,
          alt: "Papan Skor Digital BEM STMIK Tazkia",
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
    alternates: getAlternates("/tools/papan-skor", locale),
  };
}

export default function PapanSkorPage() {
  return <PapanSkorClient />;
}

