"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { FiHome, FiArrowLeft } from "react-icons/fi";

const i18n: Record<string, { title: string; desc: string; back: string; home: string; footer: string }> = {
  id: {
    title: "Halaman Tidak Ditemukan",
    desc: "Maaf, halaman yang kamu cari tidak ditemukan, telah dihapus, atau URL-nya salah.",
    back: "Kembali",
    home: "Halaman Utama",
    footer: "Portal Inovasi",
  },
  en: {
    title: "Page Not Found",
    desc: "Sorry, the page you are looking for could not be found, has been removed, or the URL is incorrect.",
    back: "Go Back",
    home: "Back to Home",
    footer: "Innovation Portal",
  },
  fr: {
    title: "Page Introuvable",
    desc: "Désolé, la page que vous cherchez est introuvable, a été supprimée ou l'URL est incorrecte.",
    back: "Retour",
    home: "Accueil",
    footer: "Portail d'Innovation",
  },
  ar: {
    title: "الصفحة غير موجودة",
    desc: "عذراً، الصفحة التي تبحث عنها غير موجودة أو تمت إزالتها أو الرابط غير صحيح.",
    back: "رجوع",
    home: "الصفحة الرئيسية",
    footer: "بوابة الابتكار",
  },
  ja: {
    title: "ページが見つかりません",
    desc: "申し訳ありませんが、お探しのページは見つかりません。削除されたか、URLが間違っている可能性があります。",
    back: "戻る",
    home: "ホームへ",
    footer: "イノベーションポータル",
  },
};

export default function RootNotFound() {
  const [lang, setLang] = useState<string>("id");

  useEffect(() => {
    const segments = window.location.pathname.split("/").filter(Boolean);
    const detected = segments[0];
    if (detected && i18n[detected]) setLang(detected);
  }, []);

  // Lock ALL scroll on body & html — page is a fixed overlay
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, []);

  const t = i18n[lang] ?? i18n.id;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes nf-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes nf-fadein {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .nf-root {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: #f8f9ff;
          font-family: 'Plus Jakarta Sans', sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          overflow: hidden;
        }

        /* background blobs — clipped inside fixed container */
        .nf-blob-1 {
          position: absolute;
          top: 0;
          right: 0;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(27,64,134,0.12) 0%, transparent 70%);
          pointer-events: none;
          transform: translate(30%, -40%);
        }
        .nf-blob-2 {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 350px;
          height: 350px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(242,121,30,0.12) 0%, transparent 70%);
          pointer-events: none;
          transform: translate(-30%, 40%);
        }

        /* outer border wrapper */
        .nf-border-wrap {
          position: relative;
          width: 100%;
          max-width: 560px;
          border-radius: 24px;
          padding: 3px;
          overflow: hidden;
          box-shadow: 0 25px 60px -15px rgba(27,64,134,0.18);
          animation: nf-fadein 0.7s cubic-bezier(0.16,1,0.3,1) forwards;
        }

        /* spinning border */
        .nf-spinner {
          position: absolute;
          width: 300%;
          height: 300%;
          top: -100%;
          left: -100%;
          background: conic-gradient(from 0deg, #f2791e 0% 50%, #1b4086 50% 100%);
          animation: nf-spin 5s linear infinite;
        }

        /* white card inside */
        .nf-card {
          position: relative;
          z-index: 10;
          background: #f8f9ff;
          border-radius: calc(24px - 3px);
          padding: 3rem 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          width: 100%;
        }

        /* lottie container */
        .nf-lottie {
          width: 280px;
          height: 220px;
          flex-shrink: 0;
        }

        .nf-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: #191c20;
          margin-bottom: 0.5rem;
          line-height: 1.2;
        }

        .nf-desc {
          font-size: 0.875rem;
          color: #44474f;
          line-height: 1.75;
          max-width: 380px;
          margin-bottom: 2rem;
        }

        .nf-btns {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          justify-content: center;
          width: 100%;
        }

        .nf-btn-back {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border-radius: 9999px;
          border: none;
          cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.875rem;
          font-weight: 700;
          color: #191c20;
          background: rgba(0,0,0,0.07);
          transition: background 0.2s, transform 0.15s;
          text-decoration: none;
        }
        .nf-btn-back:hover {
          background: rgba(0,0,0,0.13);
          transform: translateX(-2px);
        }

        .nf-btn-home {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border-radius: 9999px;
          border: none;
          cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.875rem;
          font-weight: 700;
          color: #fff;
          background: #1b4086;
          box-shadow: 0 4px 14px rgba(27,64,134,0.3);
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          text-decoration: none;
        }
        .nf-btn-home:hover {
          background: #163570;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(27,64,134,0.4);
        }

        .nf-footer {
          margin-top: 1.5rem;
          font-size: 0.75rem;
          color: rgba(0,0,0,0.35);
        }
      `}</style>

      <div className="nf-root">
        <div className="nf-blob-1" />
        <div className="nf-blob-2" />

        <div className="nf-border-wrap">
          <div className="nf-spinner" />
          <div className="nf-card">
            <div className="nf-lottie">
              <DotLottieReact
                src="/animations/404 error.lottie"
                loop
                autoplay
                renderConfig={{ devicePixelRatio: 2 }}
                style={{ width: "100%", height: "100%" }}
              />
            </div>

            <h1 className="nf-title">{t.title}</h1>
            <p className="nf-desc">{t.desc}</p>

            <div className="nf-btns">
              <button className="nf-btn-back" onClick={() => window.history.back()}>
                <FiArrowLeft size={16} /> {t.back}
              </button>
              <Link href="/" className="nf-btn-home">
                <FiHome size={16} /> {t.home}
              </Link>
            </div>
          </div>
        </div>

        <p className="nf-footer">
          BEM STMIK Tazkia &copy; {new Date().getFullYear()} &mdash; {t.footer}
        </p>
      </div>
    </>
  );
}
