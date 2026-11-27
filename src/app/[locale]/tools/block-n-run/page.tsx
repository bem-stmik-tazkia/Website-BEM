import { Metadata } from "next";
import BlockNRunClient from "./BlockNRunClient";
import { buildPageMetadata } from "@/utils/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const isId = locale === "id";
  const title = isId
    ? "Block 'n Run! 3D (Mini Game Taktik Online) | BEM STMIK Tazkia"
    : "Block 'n Run! 3D Tactical Board Mini Game | BEM STMIK Tazkia";
  const description = isId
    ? "Mainkan mini game taktik 3D Isometrik Block 'n Run! ala Quoridor secara online dan gratis dari BEM STMIK Tazkia. Adu cepat balap bidak ke garis lawan atau hadang jalan dengan tembok rintangan. Lawan Bot AI pintar atau duel 2 pemain!"
    : "Play free 3D isometric tactical mini game Block 'n Run! online from BEM STMIK Tazkia. Race your pawn to the finish line or block paths with walls. Challenge tactical AI bot or play 2-player duel!";

  return buildPageMetadata({
    locale,
    path: "/tools/block-n-run",
    title,
    description,
    imageAlt: "Block 'n Run BEM STMIK Tazkia",
    keywords: [
      "Block n run game",
      "Game quoridor online",
      "Game taktik 3D",
      "Mini game kampus",
      "Game asah otak",
      "Game santai mahasiswa",
      "BEM STMIK Tazkia games",
      "Board game online gratis",
    ],
  });
}

export default function BlockNRunPage() {
  return <BlockNRunClient />;
}
