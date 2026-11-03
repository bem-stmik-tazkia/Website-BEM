"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  FiBookOpen,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiEye,
  FiLayers,
  FiUser,
  FiCalendar,
  FiTag,
} from "react-icons/fi";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/Toast";
import ArticleModerationModal, {
  ModerationArticle,
  ModerationRevision,
} from "@/components/admin/artikel/ArticleModerationModal";

export default function AdminArtikelPage() {
  const supabase = createClient();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"pending" | "revisions" | "all">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [articles, setArticles] = useState<ModerationArticle[]>([]);
  const [revisions, setRevisions] = useState<ModerationRevision[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal review state
  const [selectedArticle, setSelectedArticle] = useState<ModerationArticle | null>(null);
  const [selectedRevision, setSelectedRevision] = useState<ModerationRevision | null>(null);

  // Load all articles & revisions
  const loadData = useCallback(async () => {
    try {
      // 1. Ambil artikel lengkap beserta profil penulis
      const { data: artData, error: artError } = await supabase
        .from("articles")
        .select(`
          *,
          author:profiles!articles_author_id_fkey(id, full_name, email, avatar_url)
        `)
        .order("created_at", { ascending: false });

      if (artError) {
        console.error("[AdminArtikel] Error loading articles:", artError);
      } else {
        setArticles(artData || []);
      }

      // 2. Ambil revisi pending beserta profil penulis dan artikel induknya
      const { data: revData, error: revError } = await supabase
        .from("article_revisions")
        .select(`
          *,
          article:articles!article_revisions_article_id_fkey(*),
          author:profiles!article_revisions_author_id_fkey(id, full_name, email, avatar_url)
        `)
        .order("created_at", { ascending: false });

      if (revError) {
        console.error("[AdminArtikel] Error loading revisions:", revError);
      } else {
        setRevisions(revData || []);
      }
    } catch (err) {
      console.error("[AdminArtikel] Unexpected error loading data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [supabase]);

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

  // Filter List Artikel
  const filteredArticles = useMemo(() => {
    return articles.filter((a) => {
      if (activeTab === "pending" && a.status !== "pending") return false;
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

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-outline-variant/40 hover:bg-surface-variant/30 text-xs sm:text-sm font-semibold transition-all self-start sm:self-auto cursor-pointer"
        >
          <FiRefreshCw className={`text-primary ${refreshing ? "animate-spin" : ""}`} />
          <span>{refreshing ? "Menyinkronkan..." : "Segarkan"}</span>
        </button>
      </div>

      {/* Grid Statistik Counter */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Antrean Baru */}
        <div
          onClick={() => setActiveTab("pending")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === "pending"
              ? "bg-amber-500/10 border-amber-500/50 shadow-md"
              : "bg-surface border-outline-variant/30 hover:border-amber-500/30"
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

        {/* Antrean Revisi */}
        <div
          onClick={() => setActiveTab("revisions")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === "revisions"
              ? "bg-purple-500/10 border-purple-500/50 shadow-md"
              : "bg-surface border-outline-variant/30 hover:border-purple-500/30"
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

        {/* Total Tayang */}
        <div
          onClick={() => setActiveTab("all")}
          className="p-4 rounded-2xl bg-surface border border-outline-variant/30 hover:border-emerald-500/30 transition-all cursor-pointer"
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

        {/* Ditolak */}
        <div
          onClick={() => setActiveTab("all")}
          className="p-4 rounded-2xl bg-surface border border-outline-variant/30 hover:border-rose-500/30 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600">Perlu Revisi / Tolak</span>
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-600">
              <FiXCircle size={16} />
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-on-surface mt-2">{rejectedCount}</p>
          <p className="text-[11px] text-on-surface-variant mt-0.5">Dikembalikan ke penulis</p>
        </div>
      </div>

      {/* Tabs & Controls Bar */}
      <div className="bg-surface border border-outline-variant/30 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-surface-variant/30 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab("pending")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
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
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
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
              onClick={() => setActiveTab("all")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-surface text-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Semua Artikel ({articles.length})
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
        /* Tab Artikel Baru / Semua */
        filteredArticles.length === 0 ? (
          <div className="bg-surface border border-outline-variant/30 rounded-2xl p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 mx-auto flex items-center justify-center mb-3">
              <FiCheckCircle size={24} />
            </div>
            <h3 className="font-bold text-sm text-on-surface">
              {activeTab === "pending" ? "Antrean Moderasi Bersih!" : "Tidak Ada Artikel Ditemukan"}
            </h3>
            <p className="text-xs text-on-surface-variant mt-1">
              {activeTab === "pending"
                ? "Tidak ada artikel baru yang menunggu persetujuan admin."
                : "Coba sesuaikan kata kunci pencarian Anda."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredArticles.map((article) => {
              const isPending = article.status === "pending";
              const isPublished = article.status === "published";
              const isRejected = article.status === "rejected";

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
                              : "bg-surface-variant/40 text-on-surface-variant"
                          }`}
                        >
                          {article.status}
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
                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-outline-variant/20">
                    <button
                      type="button"
                      onClick={() => setSelectedArticle(article)}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
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
    </div>
  );
}
