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
import { SiWhatsapp } from "react-icons/si";
import { createClient } from "@/utils/supabase/client";
import { getDeviceId } from "@/utils/identity";
import { toggleLike } from "@/actions/like";
import { recordView } from "@/actions/view";
import { useToast } from "@/components/ui/Toast";
import { PublishedArticleItem } from "../ArtikelClient";

interface Props {
  article: PublishedArticleItem;
  relatedArticles: PublishedArticleItem[];
}

export default function ArtikelDetailClient({ article, relatedArticles }: Props) {
  const t = useTranslations("ArticleDetail");
  const locale = useLocale();
  const { toast } = useToast();
  const supabase = createClient();

  const [views, setViews] = useState(article.views || 0);
  const [likes, setLikes] = useState(article.likes || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [copied, setCopied] = useState(false);

  const wordCount = article.content ? article.content.trim().split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  // Multi-User View & Like initial setup
  useEffect(() => {
    let isMounted = true;

    async function initViewsAndLikes() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || null;
        const deviceId = getDeviceId();

        // 1. Periksa status like secara aman (Multi-User Safe)
        const { data: likedStatus, error: likeError } = await supabase.rpc(
          "check_article_liked",
          {
            p_article_id: article.id,
            p_device_id: deviceId,
            p_user_id: userId,
          }
        );

        if (!likeError && isMounted) {
          setIsLiked(Boolean(likedStatus));
        }

        // 2. Multi-User View Tracking (dengan isolasi user di localStorage)
        const viewKey = userId
          ? `viewed_art_${article.id}_${userId}`
          : `viewed_art_${article.id}`;
        const lastViewedAt = localStorage.getItem(viewKey);
        const cooldownMs = 12 * 60 * 60 * 1000; // 12 jam
        const now = Date.now();
        const isStillInCooldown =
          lastViewedAt && now - parseInt(lastViewedAt, 10) < cooldownMs;

        if (!isStillInCooldown) {
          const counted = await recordView("articles", article.id, deviceId, 12);
          if (counted && isMounted) {
            setViews((prev) => prev + 1);
            localStorage.setItem(viewKey, String(now));
          } else if (!lastViewedAt) {
            localStorage.setItem(viewKey, String(now));
          }
        }
      } catch (err) {
        console.error("[ArtikelDetail] Init view/like error:", err);
      }
    }

    initViewsAndLikes();

    return () => {
      isMounted = false;
    };
  }, [article.id, supabase]);

  // Handler Like Toggle (Multi-User Safe)
  const handleToggleLike = async () => {
    if (isLiking) return;

    try {
      setIsLiking(true);
      const prevLiked = isLiked;
      const prevCount = likes;

      // Optimistic UI update
      setIsLiked(!prevLiked);
      setLikes(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

      const deviceId = getDeviceId();
      const newStatus = await toggleLike("articles", article.id, !prevLiked, deviceId);

      setIsLiked(newStatus);
      if (newStatus !== !prevLiked) {
        // Rollback jika server berbeda
        setLikes(prevCount);
      }
    } catch (err) {
      console.error("[ArtikelDetail] Like error:", err);
      toast("Gagal memperbarui like.", "error");
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
      toast("Tautan artikel berhasil disalin!", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast(t("shareFail"), "error");
    }
  };

  const handleShareNative = async () => {
    const url = getShareUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: `Baca tulisan menarik "${article.title}" oleh mahasiswa STMIK Tazkia:`,
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

  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `*${article.title}*\n\nBaca artikel karya mahasiswa STMIK Tazkia di:\n${getShareUrl()}`
  )}`;

  return (
    <div className="min-h-screen bg-background pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          href="/artikel"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
        >
          <FiArrowLeft size={16} />
          <span>Kembali ke Katalog Artikel</span>
        </Link>

        {article.category && (
          <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            {article.category}
          </span>
        )}
      </div>

      {/* Article Header */}
      <div className="space-y-4 mb-8">
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-on-surface leading-tight tracking-tight break-words [overflow-wrap:anywhere]">
          {article.title}
        </h1>

        {/* Author Bio & Date Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-outline-variant/20">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center overflow-hidden shrink-0 border border-primary/20 shadow-xs">
              {article.author?.avatar_url ? (
                <img src={article.author.avatar_url} alt="Author" className="w-full h-full object-cover" />
              ) : (
                <span className="text-base">{article.author?.full_name?.charAt(0) || "M"}</span>
              )}
            </div>
            <div>
              <p className="font-bold text-sm text-on-surface leading-tight">
                {article.author?.full_name || "Mahasiswa STMIK Tazkia"}
              </p>
              <p className="text-[11px] text-on-surface-variant mt-0.5">{t("studentAuthor")}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-on-surface-variant">
            <span className="flex items-center gap-1.5">
              <FiCalendar size={13} />
              <span>
                {new Date(article.published_at || article.created_at).toLocaleDateString(locale, {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <FiClock size={13} />
              <span>{t("minRead", { min: readingTime })}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Cover Image */}
      {article.cover_url && (
        <div className="rounded-3xl overflow-hidden mb-10 shadow-sm border border-outline-variant/30 max-h-[480px]">
          <img
            src={article.cover_url}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Main Content Body */}
      <article className="prose dark:prose-invert max-w-none mb-12 overflow-hidden">
        <div className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] leading-relaxed text-base sm:text-lg text-on-surface/90 font-normal space-y-4">
          {article.content}
        </div>
      </article>

      {/* Interactive Engagement Bar (Likes & Views & Share) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-surface border border-outline-variant/30 shadow-sm mb-12 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Like and Views Count */}
        <div className="flex items-center gap-4 w-full sm:w-auto">
          {/* Like Button */}
          <button
            type="button"
            onClick={handleToggleLike}
            disabled={isLiking}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all cursor-pointer shadow-xs ${
              isLiked
                ? "bg-rose-500 text-white shadow-rose-500/25 scale-105"
                : "bg-surface-variant/40 hover:bg-rose-500/10 text-on-surface hover:text-rose-600 border border-outline-variant/30"
            }`}
          >
            <FiHeart size={18} className={isLiked ? "fill-white" : ""} />
            <span>{t("likes", { count: likes })}</span>
          </button>

          {/* Views Badge */}
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium px-3 py-2 rounded-xl bg-surface-variant/20 border border-outline-variant/20">
            <FiEye size={14} />
            <span>{t("readers", { count: views })}</span>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-on-surface-variant font-medium mr-1 hidden sm:inline">{t("shareLabel")}</span>

          <a
            href={whatsappShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Bagikan ke WhatsApp"
            className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 transition-colors"
          >
            <SiWhatsapp size={16} />
          </a>

          <button
            type="button"
            onClick={handleShareNative}
            title="Bagikan atau Salin Tautan"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-variant/40 hover:bg-surface-variant text-on-surface text-xs font-bold border border-outline-variant/30 transition-colors cursor-pointer"
          >
            {copied ? <FiCheck className="text-emerald-500" size={15} /> : <FiShare2 size={15} />}
            <span>{copied ? t("copied") : t("share")}</span>
          </button>
        </div>
      </div>

      {/* Author Card Footer */}
      <div className="p-6 rounded-3xl bg-surface-variant/20 border border-outline-variant/20 mb-12 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary font-bold flex items-center justify-center overflow-hidden shrink-0 border border-primary/20 text-xl shadow-xs">
          {article.author?.avatar_url ? (
            <img src={article.author.avatar_url} alt="Author" className="w-full h-full object-cover" />
          ) : (
            <span>{article.author?.full_name?.charAt(0) || "M"}</span>
          )}
        </div>
        <div>
          <span className="text-[11px] font-bold text-primary uppercase tracking-wider">{t("aboutAuthor")}</span>
          <h3 className="text-lg font-black text-on-surface mt-0.5">
            {article.author?.full_name || "Mahasiswa STMIK Tazkia"}
          </h3>
          <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
            {t("curationNotice")}
          </p>
        </div>
      </div>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <div className="border-t border-outline-variant/20 pt-10">
          <h2 className="text-xl font-bold text-on-surface mb-6">{t("relatedArticles")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {relatedArticles.map((rel) => (
              <Link
                key={rel.id}
                href={`/artikel/${rel.slug}`}
                className="group p-4 rounded-2xl bg-surface border border-outline-variant/30 hover:border-primary/40 transition-all flex gap-3.5"
              >
                {rel.cover_url && (
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-surface-variant/30 shrink-0">
                    <img src={rel.cover_url} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-primary">{rel.category || "Artikel"}</span>
                  <h4 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors line-clamp-2 mt-1">
                    {rel.title}
                  </h4>
                  <span className="text-[11px] text-on-surface-variant mt-2 block">
                    {new Date(rel.published_at || rel.created_at).toLocaleDateString(locale, {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

