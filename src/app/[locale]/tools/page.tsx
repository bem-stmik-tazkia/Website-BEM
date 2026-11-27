import { Metadata } from "next";
import ToolsClient from "./ToolsClient";
import { buildPageMetadata } from "@/utils/seo";

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
    ? "Kumpulan tools utilitas dan mini games interaktif gratis dari BEM STMIK Tazkia. Mulai dari alat acak nama, papan skor digital, tic-tac-toe, hingga game taktik Block 'n Run."
    : "Collection of free interactive student utilities and mini-games from BEM STMIK Tazkia. Randomizer wheel, digital scoreboard, tic-tac-toe, and Block 'n Run.";

  return buildPageMetadata({
    locale,
    path: "/tools",
    title,
    description,
    imageAlt: "Tools & Mini Games BEM STMIK Tazkia",
    keywords: [
      "Tools mahasiswa",
      "Mini games online",
      "Alat acak nama",
      "Spinner nama kelompok",
      "Papan skor digital",
      "Game kampus",
      "BEM STMIK Tazkia",
      "Web tools edukasi",
    ],
  });
}

export default function ToolsHubPage() {
  return <ToolsClient />;
}
