"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FiBookOpen,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiSearch,
  FiEye,
  FiLayers,
  FiUser,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiFileText,
} from "react-icons/fi";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/Toast";
import ArticleModerationModal, {
  ModerationArticle,
  ModerationRevision,
} from "@/components/admin/artikel/ArticleModerationModal";
import { fetchAdminArticlesData, deleteArticleAdmin } from "./actions";

type TabType = "pending" | "revisions" | "draft" | "published" | "all";

export default function AdminArtikelPage() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const initialTabParam = searchParams?.get("tab") as TabType | null;
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<TabType>(
    initialTabParam && ["pending", "revisions", "draft", "published", "all"].includes(initialTabParam)
      ? initialTabParam
      : "pending"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [articles, setArticles] = useState<ModerationArticle[]>([]);
  const [revisions, setRevisions] = useState<ModerationRevision[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Modal review state
  const [selectedArticle, setSelectedArticle] = useState<ModerationArticle | null>(null);
  const [selectedRevision, setSelectedRevision] = useState<ModerationRevision | null>(null);

  // Load all articles & revisions via secure server action
  const loadData = useCallback(async () => {
    try {
      const res = await fetchAdminArticlesData();
      if (res.error) {
        console.error("[AdminArtikel] Error loading articles:", res.error);
      }
      setArticles(res.articles || []);
      setRevisions(res.revisions || []);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("articles_moderation_updated"));
      }
    } catch (err) {
      console.error("[AdminArtikel] Unexpected error loading data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Realtime channel listener untuk artikel dan revisi baru
    const channel = supabase
      .channel("admin_article_moderation")
      .on("postgres_changes", { event: "*", schema: "public", table: "articles" }, () => {
        loadData();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "article_revisions" }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData, supabase]);

  // Update tab jika URL search param berubah
  useEffect(() => {
    const tabParam = searchParams?.get("tab") as TabType | null;
    if (tabParam && ["pending", "revisions", "draft", "published", "all"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Statistik
  const pendingCount = useMemo(
    () => articles.filter((a) => a.status === "pending").length,
    [articles]
  );
  const pendingRevCount = useMemo(
    () => revisions.filter((r) => r.status === "pending").length,
    [revisions]
  );
  const publishedCount = useMemo(
    () => articles.filter((a) => a.status === "published").length,
    [articles]
  );
  const rejectedCount = useMemo(
    () => articles.filter((a) => a.status === "rejected").length,
    [articles]
  );
  const draftCount = useMemo(
    () => articles.filter((a) => a.status === "draft").length,
    [articles]
  );

  // Filter List Artikel
  const filteredArticles = useMemo(() => {
    return articles.filter((a) => {
      if (activeTab === "pending" && a.status !== "pending") return false;
      if (activeTab === "published" && a.status !== "published") return false;
      if (activeTab === "draft" && a.status !== "draft") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = a.title.toLowerCase().includes(q);
        const matchesAuthor = a.author?.full_name?.toLowerCase().includes(q) || false;
        const matchesCategory = a.category?.toLowerCase().includes(q) || false;
        if (!matchesTitle && !matchesAuthor && !matchesCategory) return false;
      }
      if (selectedCategory !== "all" && a.category !== selectedCategory) {
        return false;
      }
      return true;
    });
  }, [articles, activeTab, searchQuery, selectedCategory]);

  // Filter List Revisi
  const filteredRevisions = useMemo(() => {
    return revisions.filter((r) => {
      if (r.status !== "pending") return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = r.title.toLowerCase().includes(q);
        const matchesAuthor = r.author?.full_name?.toLowerCase().includes(q) || false;
        if (!matchesTitle && !matchesAuthor) return false;
      }
      return true;
    });
  }, [revisions, searchQuery]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const [articleToDelete, setArticleToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeletingTarget, setIsDeletingTarget] = useState(false);

  const confirmDeleteArticle = async () => {
    if (!articleToDelete) return;
    try {
      setIsDeletingTarget(true);
      const res = await deleteArticleAdmin(articleToDelete.id);
      if (res.error) throw new Error(res.error);
      toast("Artikel berhasil dihapus secara permanen.", "success");
      setArticleToDelete(null);
      loadData();
    } catch (err: any) {
      toast(err.message || "Gagal menghapus artikel.", "error");
    } finally {
      setIsDeletingTarget(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-on-surface flex items-center gap-2.5">
            <FiBookOpen className="text-primary" />
            <span>Moderasi Artikel Mahasiswa</span>
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            Tinjau karya tulis mahasiswa, setujui publikasi, dan berikan catatan evaluasi edukatif.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Link
            href="/dashboard/artikel/baru?from=admin"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs sm:text-sm font-semibold transition-all shadow-md shadow-primary/20 cursor-pointer"
          >
            <FiPlus size={16} />
            <span>Tulis Artikel (Admin)</span>
          </Link>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface border border-outline-variant/30 text-on-surface-variant hover:text-primary hover:border-primary/40 text-xs font-semibold transition-all shadow-sm cursor-pointer disabled:opacity-50"
            title="Muat Ulang Data"
          >
            <FiRefreshCw size={14} className={refreshing ? "animate-spin text-primary" : ""} />
            <span className="hidden sm:inline">Segarkan</span>
          </button>
        </div>
      </div>

      {/* Statistik Cards Grid (4 Status: Antrean, Revisi, Draf, Tayang) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Antrean Artikel Baru */}
        <div
          onClick={() => setActiveTab("pending")}
          className={`p-4 rounded-2xl bg-surface border transition-all cursor-pointer ${
            activeTab === "pending"
              ? "border-amber-500 shadow-sm ring-2 ring-amber-500/20 bg-amber-500/[0.02]"
              : "border-outline-variant/30 hover:border-amber-500/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600">Artikel Baru Menunggu</span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <FiClock size={16} />
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-on-surface mt-2">{pendingCount}</p>
          <p className="text-[11px] text-on-surface-variant mt-0.5">Perlu dimoderasi</p>
        </div>

        {/* Antrean Revisi Tayang */}
        <div
          onClick={() => setActiveTab("revisions")}
          className={`p-4 rounded-2xl bg-surface border transition-all cursor-pointer ${
            activeTab === "revisions"
              ? "border-purple-500 shadow-sm ring-2 ring-purple-500/20 bg-purple-500/[0.02]"
              : "border-outline-variant/30 hover:border-purple-500/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-600">Revisi Tayang Menunggu</span>
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
              <FiLayers size={16} />
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-on-surface mt-2">{pendingRevCount}</p>
          <p className="text-[11px] text-on-surface-variant mt-0.5">Revisi artikel aktif</p>
        </div>

        {/* Draf Artikel */}
        <div
          onClick={() => setActiveTab("draft")}
          className={`p-4 rounded-2xl bg-surface border transition-all cursor-pointer ${
            activeTab === "draft"
              ? "border-slate-500 shadow-sm ring-2 ring-slate-500/20 bg-slate-500/[0.02]"
              : "border-outline-variant/30 hover:border-slate-500/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Draf Artikel</span>
            <span className="p-2 rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-400">
              <FiFileText size={16} />
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-on-surface mt-2">{draftCount}</p>
          <p className="text-[11px] text-on-surface-variant mt-0.5">Draf tersimpan</p>
        </div>

        {/* Total Tayang */}
        <div
          onClick={() => setActiveTab("published")}
          className={`p-4 rounded-2xl bg-surface border transition-all cursor-pointer ${
            activeTab === "published"
              ? "border-emerald-500 shadow-sm ring-2 ring-emerald-500/20 bg-emerald-500/[0.02]"
              : "border-outline-variant/30 hover:border-emerald-500/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600">Artikel Tayang</span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <FiCheckCircle size={16} />
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-on-surface mt-2">{publishedCount}</p>
          <p className="text-[11px] text-on-surface-variant mt-0.5">Dapat dibaca publik</p>
        </div>
      </div>

      {/* Tabs & Controls Bar */}
      <div className="bg-surface border border-outline-variant/30 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Filter Tabs */}
          <div className="flex items-center flex-wrap gap-1.5 bg-surface-variant/30 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab("pending")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "pending"
                  ? "bg-surface text-amber-600 shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span>Artikel Baru</span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px]">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("revisions")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "revisions"
                  ? "bg-surface text-purple-600 shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span>Revisi Tayang</span>
              {pendingRevCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-purple-500 text-white text-[10px]">
                  {pendingRevCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("draft")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "draft"
                  ? "bg-surface text-slate-700 dark:text-slate-200 shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span>Draf</span>
              {draftCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-500 text-white text-[10px]">
                  {draftCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("published")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "published"
                  ? "bg-surface text-emerald-600 shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span>Tayang</span>
              {publishedCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-600 text-[10px]">
                  {publishedCount}
                </span>
              )}
            </button>



            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-surface text-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Semua ({articles.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul, penulis, atau topik..."
              className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-surface-variant/20 border border-outline-variant/40 text-xs text-on-surface outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin mb-3" />
          <p className="text-xs font-bold text-on-surface-variant">Memuat data moderasi artikel...</p>
        </div>
      ) : activeTab === "revisions" ? (
        /* Tab Antrean Revisi */
        filteredRevisions.length === 0 ? (
          <div className="bg-surface border border-outline-variant/30 rounded-2xl p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 mx-auto flex items-center justify-center mb-3">
              <FiCheckCircle size={24} />
            </div>
            <h3 className="font-bold text-sm text-on-surface">Tidak Ada Antrean Revisi</h3>
            <p className="text-xs text-on-surface-variant mt-1">
              Seluruh revisi artikel tayang telah selesai ditinjau.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredRevisions.map((rev) => (
              <div
                key={rev.id}
                className="bg-surface border border-outline-variant/30 hover:border-purple-500/40 rounded-2xl p-4 sm:p-5 transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded-md border border-purple-500/20">
                      Revisi Pending
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      Diajukan: {new Date(rev.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-on-surface hover:text-purple-600 transition-colors line-clamp-1">
                    {rev.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-2 text-xs text-on-surface-variant">
                    <span className="flex items-center gap-1 font-semibold text-on-surface">
                      <FiUser size={12} className="text-purple-600" />
                      <span>{rev.author?.full_name || "Mahasiswa"}</span>
                    </span>
                    <span>•</span>
                    <span className="truncate max-w-[200px]">{rev.author?.email}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedRevision(rev)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer"
                >
                  <FiEye size={14} />
                  <span>Tinjau Perubahan</span>
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Tab Artikel Baru / Draf / Tayang / Perlu Revisi / Semua */
        filteredArticles.length === 0 ? (
          <div className="bg-surface border border-outline-variant/30 rounded-2xl p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-surface-variant/40 text-on-surface-variant mx-auto flex items-center justify-center mb-3">
              <FiCheckCircle size={24} />
            </div>
            <h3 className="font-bold text-sm text-on-surface">
              {activeTab === "pending"
                ? "Antrean Moderasi Bersih!"
                : activeTab === "draft"
                ? "Belum Ada Draf Artikel"
                : activeTab === "published"
                ? "Belum Ada Artikel Tayang"
                : "Tidak Ada Artikel Ditemukan"}
            </h3>
            <p className="text-xs text-on-surface-variant mt-1">
              {activeTab === "pending"
                ? "Tidak ada artikel baru yang menunggu persetujuan admin."
                : activeTab === "draft"
                ? "Anda dapat menulis artikel baru atau menyimpan draf tulisan."
                : "Coba sesuaikan kata kunci pencarian atau tab filter Anda."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredArticles.map((article) => {
              const isPending = article.status === "pending";
              const isPublished = article.status === "published";
              const isRejected = article.status === "rejected";
              const isDraft = article.status === "draft";
              const isDeleting = deletingId === article.id;

              return (
                <div
                  key={article.id}
                  className="bg-surface border border-outline-variant/30 hover:border-primary/40 rounded-2xl p-4 sm:p-5 transition-all shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between group"
                >
                  {/* Left Thumbnail & Info */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                    {article.cover_url ? (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-surface-variant/40 shrink-0 border border-outline-variant/20">
                        <img src={article.cover_url} alt="Cover" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-surface-variant/30 text-on-surface-variant/40 flex items-center justify-center shrink-0 border border-outline-variant/20">
                        <FiBookOpen size={20} />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            isPending
                              ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                              : isPublished
                              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                              : isRejected
                              ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                              : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20"
                          }`}
                        >
                          {article.status === "draft" ? "DRAF" : article.status}
                        </span>

                        {article.category && (
                          <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                            {article.category}
                          </span>
                        )}

                        <span className="text-[11px] text-on-surface-variant">
                          {new Date(article.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm sm:text-base text-on-surface group-hover:text-primary transition-colors line-clamp-1 mb-1">
                        {article.title}
                      </h3>

                      <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                        <span className="flex items-center gap-1 font-semibold text-on-surface">
                          <FiUser size={11} className="text-primary" />
                          <span>{article.author?.full_name || "Mahasiswa"}</span>
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span className="hidden sm:inline truncate max-w-[200px]">{article.author?.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-outline-variant/20">
                    {/* Tombol Edit untuk Draf / Penulis */}
                    {(isDraft || isRejected) && (
                      <Link
                        href={`/dashboard/artikel/${article.id}/edit?from=admin`}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-surface-variant/40 hover:bg-surface-variant text-on-surface border border-outline-variant/40 text-xs font-semibold transition-all cursor-pointer"
                        title="Edit / Lanjutkan Tulisan"
                      >
                        <FiEdit2 size={13} className="text-primary" />
                        <span>Edit</span>
                      </Link>
                    )}

                    {/* Tombol Hapus Artikel */}
                    {!isPending && (
                      <button
                        type="button"
                        onClick={() => setArticleToDelete({ id: article.id, title: article.title })}
                        className="inline-flex items-center justify-center p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 text-xs transition-all cursor-pointer"
                        title="Hapus Artikel"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    )}

                    {/* Tombol Utama (Tinjau / Lihat Konten) */}
                    <button
                      type="button"
                      onClick={() => setSelectedArticle(article)}
                      className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                        isPending
                          ? "bg-primary hover:bg-primary/90 text-white shadow-primary/20"
                          : "bg-surface-variant/50 hover:bg-surface-variant text-on-surface border border-outline-variant/30"
                      }`}
                    >
                      <FiEye size={13} />
                      <span>{isPending ? "Tinjau & Putuskan" : "Lihat Konten"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Moderation Modal for Articles */}
      {selectedArticle && (
        <ArticleModerationModal
          item={selectedArticle}
          isRevisionItem={false}
          onClose={() => setSelectedArticle(null)}
          onSuccess={loadData}
        />
      )}

      {/* Moderation Modal for Revisions */}
      {selectedRevision && (
        <ArticleModerationModal
          item={selectedRevision}
          isRevisionItem={true}
          onClose={() => setSelectedRevision(null)}
          onSuccess={loadData}
        />
      )}

      {/* Modal Popup Konfirmasi Hapus In-App (Bebas dari window.confirm) */}
      {articleToDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface border border-outline-variant/40 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
              <FiTrash2 size={24} />
            </div>
            <h3 className="text-lg font-black text-on-surface">Hapus Artikel Permanen</h3>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-2 leading-relaxed">
              Apakah Anda yakin ingin menghapus artikel <strong>"{articleToDelete.title}"</strong> secara permanen? Data yang sudah dihapus tidak dapat dipulihkan.
            </p>
            <div className="flex items-center justify-end gap-2.5 mt-6">
              <button
                type="button"
                disabled={isDeletingTarget}
                onClick={() => setArticleToDelete(null)}
                className="px-4 py-2 rounded-xl border border-outline-variant/40 text-xs sm:text-sm font-bold text-on-surface hover:bg-surface-variant/40 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingTarget}
                onClick={confirmDeleteArticle}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-rose-600/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isDeletingTarget ? "Menghapus..." : "Ya, Hapus Permanen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
