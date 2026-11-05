"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { createClient } from "@/utils/supabase/client";
import {
  FiEdit3,
  FiRefreshCw,
  FiPlus,
  FiBookOpen,
} from "react-icons/fi";
import ArticleStatsCards from "@/components/dashboard/artikel/ArticleStatsCards";
import ArticleFilterTabs, {
  FilterStatus,
} from "@/components/dashboard/artikel/ArticleFilterTabs";
import ArticleCard, { ArticleItem } from "@/components/dashboard/artikel/ArticleCard";
import EmptyArticleState from "@/components/dashboard/artikel/EmptyArticleState";
import ReviewNoteModal from "@/components/dashboard/artikel/ReviewNoteModal";
import DeleteConfirmModal from "@/components/dashboard/artikel/DeleteConfirmModal";

export default function DashboardArtikelPage() {
  const t = useTranslations("DashboardArtikel");
  const supabase = createClient();
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [selectedNoteArticle, setSelectedNoteArticle] = useState<ArticleItem | null>(null);
  const [selectedDeleteArticle, setSelectedDeleteArticle] = useState<ArticleItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchArticles = useCallback(async () => {
    try {
      // Ambil data artikel dari view aman public.my_articles
      const { data, error } = await supabase
        .from("my_articles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[DashboardArtikel] Fetch error:", error.message);
        return;
      }

      setArticles(data || []);
    } catch (err) {
      console.error("[DashboardArtikel] Unexpected error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchArticles();

    // Realtime subscription untuk memantau perubahan status artikel mahasiswa
    let channel: any = null;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      channel = supabase
        .channel(`dashboard_articles_${user.id}_${Date.now()}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "articles",
            filter: `author_id=eq.${user.id}`,
          },
          () => {
            fetchArticles();
          }
        )
        .subscribe();
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase, fetchArticles]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchArticles();
  };

  const handleDeleteArticle = async () => {
    if (!selectedDeleteArticle) return;
    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from("articles")
        .delete()
        .eq("id", selectedDeleteArticle.id);

      if (error) {
        alert(`Gagal menghapus artikel: ${error.message}`);
        return;
      }

      // Optimistic update
      setArticles((prev) => prev.filter((a) => a.id !== selectedDeleteArticle.id));
      setSelectedDeleteArticle(null);
    } catch (err) {
      console.error("[DashboardArtikel] Delete failed:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Hitung jumlah untuk statistik dan filter tabs
  const counts = useMemo(() => {
    const published = articles.filter((a) => a.status === "published").length;
    const pending = articles.filter((a) => a.status === "pending").length;
    const draft = articles.filter((a) => a.status === "draft").length;
    const rejected = articles.filter((a) => a.status === "rejected").length;
    return {
      all: articles.length,
      published,
      pending,
      draft,
      rejected,
    };
  }, [articles]);

  // Filter artikel berdasarkan tab dan search query
  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      // 1. Tab filter
      if (activeTab !== "all" && article.status !== activeTab) {
        return false;
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (article.title || "").toLowerCase().includes(q);
        const categoryMatch = (article.category || "").toLowerCase().includes(q);
        return titleMatch || categoryMatch;
      }

      return true;
    });
  }, [articles, activeTab, searchQuery]);

  return (
    <div>
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-primary tracking-wide uppercase bg-primary/10 px-2.5 py-0.5 rounded-md">
              Portal Penulis Mahasiswa
            </span>
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              type="button"
              className="text-on-surface-variant hover:text-primary p-1 rounded-lg hover:bg-surface-variant/30 transition-colors cursor-pointer"
              title={t("refresh")}
            >
              <FiRefreshCw
                size={14}
                className={refreshing ? "animate-spin text-primary" : ""}
              />
            </button>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
            {t("pageTitle")}
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1 max-w-xl">
            {t("pageSubtitle")}
          </p>
        </div>

        {/* CTA Tulis Artikel Baru */}
        <Link
          href="/dashboard/artikel/baru"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-sm shadow-md shadow-primary/25 transition-all hover:scale-[1.02] shrink-0 text-center cursor-pointer"
        >
          <span>{t("btnWriteNew")}</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <ArticleStatsCards
        total={counts.all}
        published={counts.published}
        pending={counts.pending}
        rejected={counts.rejected}
        draft={counts.draft}
      />

      {/* Filters & Search */}
      <ArticleFilterTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        counts={counts}
      />

      {/* Content Section */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="w-full h-36 bg-surface border border-outline-variant/30 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : filteredArticles.length > 0 ? (
        <div className="space-y-4 animate-fade-in">
          {filteredArticles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onOpenReviewNote={setSelectedNoteArticle}
              onOpenDelete={setSelectedDeleteArticle}
            />
          ))}
        </div>
      ) : (
        <EmptyArticleState
          hasFilter={activeTab !== "all" || searchQuery.trim().length > 0}
          onResetFilter={() => {
            setActiveTab("all");
            setSearchQuery("");
          }}
        />
      )}

      {/* Modal Catatan Review */}
      <ReviewNoteModal
        isOpen={Boolean(selectedNoteArticle)}
        onClose={() => setSelectedNoteArticle(null)}
        title={selectedNoteArticle?.title || ""}
        note={selectedNoteArticle?.review_note || null}
      />

      {/* Modal Konfirmasi Hapus */}
      <DeleteConfirmModal
        isOpen={Boolean(selectedDeleteArticle)}
        onClose={() => setSelectedDeleteArticle(null)}
        onConfirm={handleDeleteArticle}
        title={selectedDeleteArticle?.title || ""}
        isDeleting={isDeleting}
      />
    </div>
  );
}

