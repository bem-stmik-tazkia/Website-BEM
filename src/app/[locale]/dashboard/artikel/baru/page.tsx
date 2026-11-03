import React from "react";
import ArticleForm from "@/components/dashboard/artikel/ArticleForm";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ArticlePortal" });
  return {
    title: `${t("newTitle")} - BEM STMIK Tazkia`,
    description: t("newSubtitle"),
  };
}

export default function BaruArticlePage() {
  return (
    <div className="w-full">
      <ArticleForm mode="new" />
    </div>
  );
}
