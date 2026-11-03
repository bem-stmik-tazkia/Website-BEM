import React from "react";
import ArticleForm from "@/components/dashboard/artikel/ArticleForm";

export const metadata = {
  title: "Tulis Artikel Baru - Portal Penulis Mahasiswa BEM STMIK Tazkia",
  description: "Tulis dan ajukan draf artikel karya ilmiah, opini, atau kegiatan mahasiswa Tazkia.",
};

export default function BaruArticlePage() {
  return (
    <div className="w-full">
      <ArticleForm mode="new" />
    </div>
  );
}
