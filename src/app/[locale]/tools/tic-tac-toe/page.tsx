import { Metadata } from "next";
import TicTacToeClient from "./TicTacToeClient";
import { getAlternates } from "@/utils/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const isId = locale === "id";
  const title = isId
    ? "Tic Tac Toe Kampus (Mini Game Online) | BEM STMIK Tazkia"
    : "Campus Tic Tac Toe Mini Game | BEM STMIK Tazkia";
  const description = isId
    ? "Mainkan mini game Tic Tac Toe (X-O) online gratis dari BEM STMIK Tazkia. Lawan bot AI pintar atau main berdua bersama teman satu layar. Tanpa login dan responsif!"
    : "Play free online Tic Tac Toe from BEM STMIK Tazkia. Challenge smart AI or play 2-player mode on the same device.";

  return {
    title,
    description,
    keywords: [
      "Tic tac toe online",
      "Game XO gratis",
      "Mini game kampus",
      "Game santai mahasiswa",
      "BEM STMIK Tazkia games",
      "Permainan asah otak",
    ],
    openGraph: {
      title,
      description,
      url: `https://bem.stmik.tazkia.ac.id/${locale}/tools/tic-tac-toe`,
      siteName: "BEM STMIK Tazkia",
      images: [
        {
          url: "/images/logo2.webp",
          width: 1200,
          height: 630,
          alt: "Tic Tac Toe BEM STMIK Tazkia",
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
    alternates: getAlternates("/tools/tic-tac-toe", locale),
  };
}

export default function TicTacToePage() {
  return <TicTacToeClient />;
}

