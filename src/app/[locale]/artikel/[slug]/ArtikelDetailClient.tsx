"use client";

import React, { useState, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import {
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiEye,
  FiHeart,
  FiShare2,
  FiUser,
  FiTag,
  FiCheck,
  FiBookmark,
} from "react-icons/fi";
import { createClient } from "@/utils/supabase/client";
import { getDeviceId } from "@/utils/identity";
import { toggleLike } from "@/actions/like";
import { recordView } from "@/actions/view";
import { useToast } from "@/components/ui/Toast";
import { useTranslatedContent } from "@/hooks/useTranslatedContent";
import { PublishedArticleItem } from "../ArtikelClient";

interface Props {
  article: PublishedArticleItem;
  relatedArticles: PublishedArticleItem[];
}

export default function ArtikelDetailClient({ article, relatedArticles }: Props) {
  const t = useTranslations("ArticleDetail");
  const tList = useTranslations("ArticleList");
  const locale = useLocale();
  const { toast } = useToast();
  const supabase = createClient();

  // Helper untuk menerjemahkan nama kategori secara dinamis
  const translateCategory = (cat?: string | null) => {
    if (!cat) return "";
    const c = cat.toLowerCase().trim();
    if (c === "semua" || c === "all") return tList("catAll");
    if (c.includes("opini") || c.includes("opinion") || c.includes("esai") || c.includes("essay")) return tList("catOpinion");
    if (c.includes("teknologi") || c.includes("tech") || c.includes("ai")) return tList("catTech");
    if (c.includes("akademik") || c.includes("academic") || c.includes("riset") || c.includes("research")) return tList("catAcademic");
    if (c.includes("prestasi") || c.includes("achievement")) return tList("catAchievement");
    if (c.includes("kegiatan") || c.includes("kampus") || c.includes("campus") || c.includes("activity")) return tList("catCampus");
    if (c.includes("tips") || c.includes("karir") || c.includes("career")) return tList("catCareer");
    if (c.includes("seni") || c.includes("budaya") || c.includes("art")) return tList("catArts");
    if (c.includes("lain") || c.includes("other")) return tList("catOther");
    if (c === "artikel" || c === "article") return tList("pageTitle");
    return cat;
  };

  // Terjemahkan hanya JUDUL artikel sesuai bahasa yang dipilih (isi konten tetap 100% asli)
  const { data: displayArticle } = useTranslatedContent(
    article,
    "articles",
    locale,
    ["title"]
  );

  const articleTitle = displayArticle?.title || article.title;

  const [views, setViews] = useState(article.views || 0);
  const [likes, setLikes] = useState(article.likes || 0);
  // Inisialisasi status like instan dari cache lokal (0ms delay)
  const [isLiked, setIsLiked] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`liked_art_${article.id}`) === "true";
    }
    return false;
  });
  const [isLiking, setIsLiking] = useState(false);
  const [copied, setCopied] = useState(false);

  const wordCount = article.content ? article.content.trim().split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const isBemAdmin = Boolean(
    article.author?.full_name?.toLowerCase().includes("bem") ||
    article.author?.full_name?.toLowerCase().includes("admin")
  );

  // Multi-User View & Like initial setup + Realtime Updates
  useEffect(() => {
    let isMounted = true;

    async function initViewsAndLikes() {
      try {
        const deviceId = getDeviceId();

        // 1. Eksekusi paralel: Ambil user auth & stats terbaru dari DB (bypass cache)
        const [authRes, statsRes] = await Promise.all([
          supabase.auth.getUser(),
          supabase
            .from("articles")
            .select("views, likes")
            .eq("id", article.id)
            .maybeSingle(),
        ]);

        const userId = authRes.data?.user?.id || null;

        if (statsRes.data && isMounted) {
          setViews(statsRes.data.views || 0);
          setLikes(statsRes.data.likes || 0);
        }

        // 2. Periksa status like secara aman (Multi-User Safe)
        const { data: likedStatus, error: likeError } = await supabase.rpc(
          "check_article_liked",
          {
            p_article_id: article.id,
            p_device_id: deviceId,
            p_user_id: userId,
          }
        );

        if (!likeError && isMounted && typeof likedStatus === "boolean") {
          setIsLiked(likedStatus);
          localStorage.setItem(`liked_art_${article.id}`, String(likedStatus));
        }

        // 3. Multi-User View Tracking (dengan optimasi instan tanpa menunggu network)
        const viewKey = userId
          ? `viewed_art_${article.id}_${userId}`
          : `viewed_art_${article.id}`;
        const lastViewedAt = localStorage.getItem(viewKey) || localStorage.getItem(`viewed_art_${article.id}`);
        const cooldownMs = 12 * 60 * 60 * 1000; // 12 jam
        const now = Date.now();
        const isStillInCooldown = Boolean(
          lastViewedAt && 
          now - parseInt(lastViewedAt, 10) < cooldownMs &&
          ((article.views || 0) > 0)
        );

        if (!isStillInCooldown) {
          // Update tampilan views secara instan (Optimistic UI 0ms)
          setViews((prev) => prev + 1);
          localStorage.setItem(viewKey, String(now));
          if (userId) {
            localStorage.setItem(`viewed_art_${article.id}`, String(now));
          }

          // Catat ke server secara asinkron tanpa menahan UI
          recordView("articles", article.id, deviceId, 12).catch((err) => {
            console.warn("[ArtikelDetail] View record async error:", err);
          });
        }
      } catch (err) {
        console.error("[ArtikelDetail] Init view/like error:", err);
      }
    }

    initViewsAndLikes();

    // Subscribe ke pembaruan realtime likes & views artikel
    const channel = supabase
      .channel(`article_live_${article.id}_${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "articles",
          filter: `id=eq.${article.id}`,
        },
        (payload: any) => {
          if (payload.new && isMounted) {
            if (typeof payload.new.views === "number") setViews(payload.new.views);
            if (typeof payload.new.likes === "number") setLikes(payload.new.likes);
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [article.id, supabase]);

  // Handler Like Toggle (Optimistic Instan & Multi-User Safe)
  const handleToggleLike = async () => {
    if (isLiking) return;

    try {
      setIsLiking(true);
      const prevLiked = isLiked;
      const prevCount = likes;
      const nextLiked = !prevLiked;

      // Optimistic UI update instan (0ms)
      setIsLiked(nextLiked);
      setLikes(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);
      localStorage.setItem(`liked_art_${article.id}`, String(nextLiked));

      const deviceId = getDeviceId();
      const newStatus = await toggleLike("articles", article.id, nextLiked, deviceId);

      setIsLiked(newStatus);
      localStorage.setItem(`liked_art_${article.id}`, String(newStatus));
      if (newStatus !== nextLiked) {
        // Rollback jika server berbeda
        setLikes(prevCount);
      }
    } catch (err) {
      console.error("[ArtikelDetail] Like error:", err);
      toast(t("shareFail"), "error");
    } finally {
      setIsLiking(false);
    }
  };

  // Share handlers
  const getShareUrl = () => {
    if (typeof window !== "undefined") {
      return window.location.href;
    }
    return `https://bem.stmik.tazkia.ac.id/artikel/${article.slug}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setCopied(true);
      toast(t("linkCopied"), "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast(t("shareFail"), "error");
    }
  };

  const handleShare = async () => {
    const url = getShareUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: articleTitle,
          text: `Baca artikel "${articleTitle}" oleh ${article.author?.full_name || "Mahasiswa"} di Portal Intelektual BEM STMIK Tazkia.`,
          url: url,
        });
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 sm:pt-28 pb-32 sm:pb-24 px-3.5 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full overflow-x-hidden">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
        <Link
          href="/artikel"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
        >
          <FiArrowLeft size={16} />
          <span>{t("backToArticles")}</span>
        </Link>

        {article.category && (
          <span className="text-[11px] sm:text-xs font-bold text-primary bg-primary/10 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border border-primary/20 shrink-0">
            {translateCategory(article.category)}
          </span>
        )}
      </div>

      {/* Article Header */}
      <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-on-surface leading-tight tracking-tight break-words [overflow-wrap:anywhere]">
          {articleTitle}
        </h1>

        {/* Author Bio & Date Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 py-3 sm:py-4 border-y border-outline-variant/20">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center overflow-hidden shrink-0 border border-primary/20 shadow-xs">
              {article.author?.avatar_url ? (
                <img src={article.author.avatar_url} alt={article.author?.full_name || "Author"} className="w-full h-full object-cover" />
              ) : isBemAdmin ? (
                <img src="/images/logo2.webp" alt="BEM STMIK Tazkia" className="w-full h-full object-contain p-1.5" />
              ) : (
                <span className="text-sm sm:text-base">{article.author?.full_name?.charAt(0) || "M"}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs sm:text-sm text-on-surface leading-tight truncate">
                {article.author?.full_name || t("defaultAuthor")}
              </p>
              <p className="text-[10px] sm:text-[11px] text-on-surface-variant mt-0.5">{t("studentAuthor")}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 text-xs text-on-surface-variant shrink-0">
            <span className="flex items-center gap-1.5">
              <FiCalendar size={13} className="shrink-0" />
              <span>
                {new Date(article.published_at || article.created_at).toLocaleDateString(locale, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </span>
            <span className="opacity-40">•</span>
            <span className="flex items-center gap-1.5">
              <FiClock size={13} className="shrink-0" />
              <span>{t("minRead", { min: readingTime })}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Cover Image */}
      {article.cover_url && (
        <div className="rounded-2xl sm:rounded-3xl overflow-hidden mb-6 sm:mb-10 shadow-xs sm:shadow-sm border border-outline-variant/30 aspect-[16/9] sm:aspect-[21/9] max-h-64 sm:max-h-[420px] w-full bg-surface-variant/20">
          <img
            src={article.cover_url}
            alt={articleTitle}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Main Content Body (Pure 100% Konten Asli Penulis) */}
      <article className="prose dark:prose-invert max-w-none mb-8 sm:mb-12 overflow-hidden">
        <div className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] leading-relaxed text-sm sm:text-base md:text-lg text-on-surface/90 font-normal space-y-3 sm:space-y-4">
          {article.content}
        </div>
      </article>

      {/* Interactive Engagement Bar (Likes & Views & Share) */}
      <div className="p-3 sm:p-4 md:p-5 rounded-2xl sm:rounded-3xl bg-surface border border-outline-variant/30 shadow-xs sm:shadow-sm mb-8 sm:mb-12 flex items-center justify-between gap-2.5 sm:gap-3">
        {/* Like and Views Count */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Like Button */}
          <button
            type="button"
            onClick={handleToggleLike}
            disabled={isLiking}
            className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-xs shrink-0 ${
              isLiked
                ? "bg-rose-500 text-white shadow-rose-500/25 scale-105"
                : "bg-surface-variant/40 hover:bg-rose-500/10 text-on-surface hover:text-rose-600 border border-outline-variant/30"
            }`}
          >
            <FiHeart size={16} className={isLiked ? "fill-white" : ""} />
            <span>{t("likes", { count: likes })}</span>
          </button>

          {/* Views Badge */}
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-on-surface-variant font-medium px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-surface-variant/20 border border-outline-variant/20 shrink-0">
            <FiEye size={13} />
            <span>{t("readers", { count: views })}</span>
          </div>
        </div>

        {/* Share Button */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-surface-variant/40 hover:bg-surface-variant border border-outline-variant/30 text-xs sm:text-sm font-bold text-on-surface transition-all cursor-pointer shrink-0"
            title={t("share")}
          >
            {copied ? <FiCheck size={15} className="text-emerald-500" /> : <FiShare2 size={15} />}
            <span>{copied ? t("copied") : t("share")}</span>
          </button>
        </div>
      </div>

      {/* Author Bio Box */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-surface border border-outline-variant/30 mb-8 sm:mb-12 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 sm:gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 text-primary font-bold flex items-center justify-center overflow-hidden shrink-0 border border-primary/20">
            {article.author?.avatar_url ? (
              <img src={article.author.avatar_url} alt={article.author?.full_name || "Author"} className="w-full h-full object-cover" />
            ) : isBemAdmin ? (
              <img src="/images/logo2.webp" alt="BEM STMIK Tazkia" className="w-full h-full object-contain p-2" />
            ) : (
              <span className="text-lg sm:text-xl">{article.author?.full_name?.charAt(0) || "M"}</span>
            )}
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md">
              {t("aboutAuthor")}
            </span>
            <h3 className="text-sm sm:text-base font-bold text-on-surface mt-1">
              {article.author?.full_name || t("defaultAuthor")}
            </h3>
            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
              {article.author?.bio || t("defaultBio")}
            </p>
          </div>
        </div>
      </div>

      {/* Related Articles */}
      {relatedArticles && relatedArticles.length > 0 && (
        <div className="pt-6 sm:pt-8 border-t border-outline-variant/20">
          <h2 className="text-base sm:text-xl font-bold text-on-surface mb-4 sm:mb-6">
            {t("relatedArticles")}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {relatedArticles.map((rel) => (
              <Link
                key={rel.id}
                href={`/artikel/${rel.slug}`}
                className="group p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-surface border border-outline-variant/30 hover:border-primary/40 transition-all flex gap-3"
              >
                {rel.cover_url && (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-surface-variant/40 shrink-0">
                    <img src={rel.cover_url} alt={rel.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-primary">{translateCategory(rel.category)}</span>
                  <h4 className="text-xs sm:text-sm font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-2 mt-0.5 break-words">
                    {rel.title}
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-on-surface-variant mt-1">
                    {new Date(rel.published_at || rel.created_at).toLocaleDateString(locale, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
