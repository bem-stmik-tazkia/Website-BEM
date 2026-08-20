"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiCalendar,
  FiUser,
  FiClock,
  FiShare2,
  FiHeart,
  FiEye,
  FiTag,
  FiFacebook,
  FiTwitter,
  FiLinkedin
} from "react-icons/fi";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { toggleLike } from "@/actions/like";
import { recordView } from "@/actions/view";
import { createClient } from "@/utils/supabase/client";
import { getDeviceId } from "@/utils/identity";
import { useToast } from "@/components/ui/Toast";
import { useTranslations } from "next-intl";
import DOMPurify from "isomorphic-dompurify";

interface NewsDetail {
  id: string;
  title: string;
  slug: string;
  category: string;
  created_at: string;
  author: string;
  views: number;
  likes: number;
  image_url: string;
  tags: string[];
  content: string;
}

export default function BeritaDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const t = useTranslations("NewsDetail");
  const [liked, setLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [newsDetail, setNewsDetail] = useState<NewsDetail | null>(null);
  const [relatedNews, setRelatedNews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleShare = async () => {
    if (!newsDetail) return;
    const shareData = {
      title: newsDetail.title,
      text: t("shareText", { title: newsDetail.title }),
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast(t("copied"), "success");
      } catch (err) {
        toast(t("copyFail"), "error");
      }
    }
  };

  // Konversi class Quill alignment ke inline style agar 100% tampil di semua browser
  function processQuillHtml(html: string): string {
    return html
      .replace(/class="ql-align-center"/g, 'style="text-align:center"')
      .replace(/class="ql-align-right"/g, 'style="text-align:right"')
      .replace(/class="ql-align-justify"/g, 'style="text-align:justify"')
      .replace(/class="ql-align-left"/g, 'style="text-align:left"');
  }

  useEffect(() => {
    async function fetchDetail() {
      setIsLoading(true);
      const supabase = createClient();

      const { data: detailData } = await supabase
        .from('berita')
        .select('*')
        .eq('slug', params.id)
        .single();

      if (detailData) {
        // Proses HTML untuk memastikan formatting tampil dengan benar
        const processedData = {
          ...detailData,
          content: processQuillHtml(detailData.content || '')
        };
        setNewsDetail(processedData);
        setViewCount(detailData.views || 0);
        setLikeCount(detailData.likes || 0);

        // Check authenticated user
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id || null;

        // Anti-Spam View & Likes Tracking (Universal Identity)
        const deviceId = getDeviceId();

        // Check if already liked via RPC (Bypass RLS on logs)
        const { data: isLiked } = await supabase.rpc('check_berita_liked', {
          p_berita_id: detailData.id,
          p_device_id: deviceId,
          p_user_id: userId
        });

        if (isLiked) {
          setLiked(true);
        }

        // Direct View Tracking (No Cooldown - Increases on every open)
        await recordView('berita', detailData.id);
        setViewCount(prev => prev + 1);

        // Fetch related based on category
        const { data: relatedData } = await supabase
          .from('berita')
          .select('*')
          .eq('category', detailData.category)
          .neq('id', detailData.id)
          .limit(2);

        if (relatedData) setRelatedNews(relatedData);
      }
      setIsLoading(false);
    }

    if (params.id) {
      fetchDetail();
    }
  }, [params.id]);

  const handleToggleLike = async () => {
    if (!newsDetail || isLiking) return;
    setIsLiking(true);

    // Optimistic UI Update
    setLiked(!liked);
    setLikeCount(prev => liked ? Math.max(0, prev - 1) : prev + 1);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;
      const deviceId = getDeviceId();

      const { data: isNowLiked, error } = await supabase.rpc('toggle_berita_like', {
        p_berita_id: newsDetail.id,
        p_device_id: deviceId || 'unknown',
        p_user_id: userId
      });

      if (error) throw error;

      // Sync with actual DB result just in case
      setLiked(isNowLiked);
    } catch (err) {
      console.error(err);
      // Revert optimistic update on error
      setLiked(liked);
      setLikeCount(prev => liked ? prev + 1 : Math.max(0, prev - 1));
    } finally {
      setIsLiking(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center pt-32 pb-20"><div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!newsDetail) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-on-surface">{t("notFound")}</h1>
        <Link href="/berita" className="mt-4 text-primary hover:underline">{t("backToList")}</Link>
      </div>
    );
  }

  return (
    <div className="bg-[#f8f9fc] min-h-screen pt-36 pb-20">

      {/* ── BACK BUTTON & HEADER INFO ───────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-5 md:px-10 mb-6">
        <Link href="/berita" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-medium text-sm mb-8">
          <FiArrowLeft /> {t("backToNews")}
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="bg-[var(--color-primary)] text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
              {newsDetail.category}
            </span>
            <span className="flex items-center gap-1.5 text-sm text-on-surface-variant font-medium">
              <FiCalendar className="text-[var(--color-primary)]" /> {new Date(newsDetail.created_at).toLocaleDateString('id-ID')}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-base font-bold text-on-background mt-3 md:mt-0">
            <span className="flex items-center gap-1.5 px-4 py-2 bg-surface rounded-full border border-outline-variant/30 shadow-sm">
              <FiEye className="text-[var(--color-primary)]" size={20} /> {viewCount.toLocaleString()}
            </span>
            <button
              onClick={handleToggleLike}
              disabled={isLiking}
              className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-sm transition-colors cursor-pointer border ${liked ? "bg-red-50 border-red-200" : "bg-surface border-outline-variant/30 hover:border-red-200"} ${isLiking ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              <div className="w-6 h-6 flex items-center justify-center -ml-1 -mr-1 shrink-0">
                {liked ? (
                  <DotLottieReact src="/animations/Heart Animated.lottie" autoplay loop={false} />
                ) : (
                  <FiHeart className="text-on-surface-variant/70 hover:text-red-500 transition-colors" size={20} />
                )}
              </div>
              <span className={liked ? "text-red-500 font-bold" : "text-on-surface-variant font-bold"}>
                {likeCount.toLocaleString()}
              </span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 bg-surface border border-outline-variant/30 text-on-surface-variant rounded-full hover:border-gray-400 hover:text-on-background transition-colors duration-300 shadow-sm"
            >
              <FiShare2 size={18} /> Bagikan
            </button>
          </div>
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold text-on-background leading-tight max-w-4xl mb-6">
          {newsDetail.title}
        </h1>

        <div className="flex flex-wrap items-center gap-6 mb-10 mt-2">
          <div className="flex items-center gap-3 bg-surface p-2 pr-6 rounded-full border border-outline-variant/30 shadow-sm">
            <div className="w-11 h-11 rounded-full overflow-hidden bg-white border border-outline-variant/20 flex items-center justify-center p-1 shrink-0">
              <img src="/images/logo2.webp" alt="BEM Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-extrabold text-[var(--color-primary)] tracking-wider">{t("author")}</span>
              <span className="font-bold text-on-background text-sm">{newsDetail.author.replace(/Humas\s+/i, '')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── HERO IMAGE ─────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-5 md:px-10 mb-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
          className="w-full aspect-[21/9] md:aspect-[21/8] rounded-3xl overflow-hidden shadow-lg border border-outline-variant/20"
        >
          <img
            src={newsDetail.image_url}
            alt={newsDetail.title}
            className="w-full h-full object-cover"
          />
        </motion.div>
      </section>

      {/* ── MAIN CONTENT & SIDEBAR ─────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-5 md:px-10 grid grid-cols-1 lg:grid-cols-12 gap-10">

        {/* Article Body */}
        <article className="lg:col-span-8 bg-surface rounded-3xl p-8 md:p-12 border border-outline-variant/20 shadow-sm">
          {/* Inject CSS langsung ke DOM agar pasti bisa override Tailwind */}
          <style>{`
            .ql-content ul { list-style-type: disc !important; padding-left: 1.8em !important; margin: 0.5em 0 !important; }
            .ql-content ol { list-style-type: decimal !important; padding-left: 1.8em !important; margin: 0.5em 0 !important; }
            .ql-content li { display: list-item !important; }
            .ql-content h1 { font-size: 1.8em; font-weight: 700; margin: 0.5em 0; }
            .ql-content h2 { font-size: 1.4em; font-weight: 700; margin: 0.5em 0; }
            .ql-content h3 { font-size: 1.2em; font-weight: 700; margin: 0.5em 0; }
            .ql-content a { color: #1b4086; text-decoration: underline; }
            .ql-content p { margin-bottom: 0.6em; }
          `}</style>
          <div
            className="ql-content"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(newsDetail.content) }}
          />

          {/* Tags */}
          <div className="mt-12 pt-8 border-t border-outline-variant/20">
            <h4 className="text-sm font-bold text-on-background mb-4 flex items-center gap-2">
              <FiTag className="text-[var(--color-primary)]" /> {t("relatedTags")}
            </h4>
            <div className="flex flex-wrap gap-2">
              {newsDetail.tags.filter((tag: string) => tag.length <= 25).map((tag) => (
                <Link key={tag} href={`/berita?tag=${tag.toLowerCase()}`} className="px-4 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-sm font-medium text-on-surface-variant hover:border-[var(--color-primary)]/50 hover:text-[var(--color-primary)] transition-colors">
                  #{tag}
                </Link>
              ))}
            </div>
          </div>

          {/* Social Share Bottom */}
          <div className="mt-12 p-8 bg-surface rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 border border-outline-variant/30 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-primary)]/5 rounded-bl-full -z-0"></div>
            <div className="flex flex-col z-10">
              <span className="font-extrabold text-lg text-on-background">{t("shareTitle")}</span>
              <span className="text-sm text-on-surface-variant">{t("shareDesc")}</span>
            </div>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-6 py-3 bg-[var(--color-primary)] text-white rounded-xl font-bold shadow-md hover:-translate-y-1 hover:shadow-lg hover:bg-blue-800 transition-all duration-300 z-10"
            >
              <FiShare2 size={18} /> {t("shareNow")}
            </button>
          </div>

        </article>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-8">

          {/* Related News Widget */}
          <div className="bg-surface rounded-3xl p-6 border border-outline-variant/20 shadow-sm">
            <h3 className="text-lg font-bold text-on-background mb-6 flex items-center gap-2">
              <span className="w-2 h-6 bg-[var(--color-secondary)] rounded-full"></span>
              {t("relatedNews")}
            </h3>

            <div className="flex flex-col gap-5">
              {relatedNews.map((item) => (
                <Link key={item.id} href={`/berita/${item.slug}`} className="group flex gap-4 items-start">
                  <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 border border-outline-variant/20">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] font-bold text-[var(--color-secondary)] uppercase tracking-wider mb-1 block">
                      {item.category}
                    </span>
                    <h4 className="text-sm font-bold text-on-background group-hover:text-[var(--color-primary)] transition-colors line-clamp-2 leading-snug mb-2">
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-on-surface-variant font-medium flex items-center gap-1">
                      <FiCalendar size={10} /> {item.date}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <Link href="/berita" className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-[var(--color-primary)] text-[var(--color-primary)] text-sm font-bold hover:bg-[var(--color-primary)] hover:text-white transition-colors">
              {t("viewAll")}
            </Link>
          </div>



        </aside>

      </section>

    </div>
  );
}
