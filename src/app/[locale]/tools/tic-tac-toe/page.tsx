import { Metadata } from "next";
import TicTacToeClient from "./TicTacToeClient";
import { buildPageMetadata } from "@/utils/seo";

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

  return buildPageMetadata({
    locale,
    path: "/tools/tic-tac-toe",
    title,
    description,
    imageAlt: "Tic Tac Toe BEM STMIK Tazkia",
    keywords: [
      "Tic tac toe online",
      "Game XO gratis",
      "Mini game kampus",
      "Game santai mahasiswa",
      "BEM STMIK Tazkia games",
      "Permainan asah otak",
    ],
  });
}

export default function TicTacToePage() {
  return <TicTacToeClient />;
}
