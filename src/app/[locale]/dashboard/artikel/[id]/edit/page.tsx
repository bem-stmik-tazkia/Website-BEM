"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { FiArrowLeft, FiAlertTriangle } from "react-icons/fi";
import { createClient } from "@/utils/supabase/client";
import ArticleForm from "@/components/dashboard/artikel/ArticleForm";
import { ArticleItem } from "@/components/dashboard/artikel/ArticleCard";

export default function EditArticlePage() {
  const t = useTranslations("ArticlePortal");
  const params = useParams();
  const articleId = params?.id as string;
  const supabase = createClient();

  const [article, setArticle] = useState<ArticleItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);

  useEffect(() => {
    async function loadArticle() {
      if (!articleId) return;

      try {
        setLoading(true);
        // Ambil data dari view terproteksi my_articles (hanya artikel milik author_id = auth.uid())
        const { data, error } = await supabase
          .from("my_articles")
          .select("*")
          .eq("id", articleId)
          .maybeSingle();

        if (error || !data) {
          console.error("[EditArticlePage] Error or article not found:", error);
          setNotFoundState(true);
          return;
        }

        setArticle(data);
      } catch (err) {
        console.error("[EditArticlePage] Unexpected error:", err);
        setNotFoundState(true);
      } finally {
        setLoading(false);
      }
    }

    loadArticle();
  }, [articleId, supabase]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 flex flex-col items-center justify-center text-center">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-semibold text-on-surface-variant">{t("loadingArticle")}</p>
      </div>
    );
  }

  if (notFoundState || !article) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 mx-auto flex items-center justify-center mb-4">
          <FiAlertTriangle size={28} />
        </div>
        <h2 className="text-xl font-bold text-on-surface mb-2">{t("notFoundTitle")}</h2>
        <p className="text-xs sm:text-sm text-on-surface-variant mb-6 leading-relaxed">
          {t("notFoundDesc")}
        </p>
        <Link
          href="/dashboard/artikel"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs sm:text-sm font-bold shadow-md hover:bg-primary/90 transition-all"
        >
          <FiArrowLeft size={16} />
          <span>{t("backToDashboard")}</span>
        </Link>
      </div>
    );
  }

  // Jika artikel berstatus pending, beri tahu bahwa artikel terkunci sedang direview
  if (article.status === "pending") {
    return (
      <div className="max-w-lg mx-auto py-16 px-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 mx-auto flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-3xl">hourglass_top</span>
        </div>
        <h2 className="text-xl font-bold text-on-surface mb-2">{t("pendingReviewTitle")}</h2>
        <p className="text-xs sm:text-sm text-on-surface-variant mb-6 leading-relaxed">
          {t("pendingReviewDesc", { title: article.title })}
        </p>
        <Link
          href="/dashboard/artikel"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs sm:text-sm font-bold shadow-md hover:bg-primary/90 transition-all"
        >
          <FiArrowLeft size={16} />
          <span>{t("backToDashboard")}</span>
        </Link>
      </div>
    );
  }

  // Jika artikel berstatus published, kunci pengeditan langsung demi integritas publikasi
  if (article.status === "published") {
    return (
      <div className="max-w-lg mx-auto py-16 px-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-4 border border-amber-500/20">
          <FiAlertTriangle size={28} />
        </div>
        <h2 className="text-xl font-bold text-on-surface mb-2">{t("publishedLockTitle")}</h2>
        <p className="text-xs sm:text-sm text-on-surface-variant mb-6 leading-relaxed">
          {t("publishedLockDesc", { title: article.title })}
        </p>
        <Link
          href="/dashboard/artikel"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs sm:text-sm font-bold shadow-md hover:bg-primary/90 transition-all cursor-pointer"
        >
          <FiArrowLeft size={16} />
          <span>{t("backToDashboard")}</span>
        </Link>
      </div>
    );
  }

  const formMode = "edit";

  return (
    <div className="w-full">
      <ArticleForm initialData={article} mode={formMode} />
    </div>
  );
}

