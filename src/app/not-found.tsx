"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { FiHome, FiArrowLeft } from "react-icons/fi";

// Teks per bahasa (sinkron dengan messages/*.json NotFound)
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
    // Detect locale from URL path e.g. /en/login → "en"
    const segments = window.location.pathname.split("/").filter(Boolean);
    const detected = segments[0];
    if (detected && i18n[detected]) {
      setLang(detected);
    }
  }, []);

  const t = i18n[lang] ?? i18n.id;

  return (
    <html lang={lang}>
      <head>
        <title>{t.title} | BEM STMIK Tazkia</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            background: #ffffff;
            font-family: 'Plus Jakarta Sans', sans-serif;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem 1rem;
            position: relative;
            overflow: hidden;
          }
          .border-wrapper {
            position: relative;
            width: 100%; max-width: 560px;
            border-radius: 24px; padding: 3px;
            overflow: hidden;
            box-shadow: 0 25px 60px -15px rgba(27,64,134,0.15);
          }
          .spinner {
            position: absolute;
            width: 300%; height: 300%;
            top: -100%; left: -100%;
            background: conic-gradient(from 0deg, #f2791e 0% 50%, #1b4086 50% 100%);
            animation: spin-border 5s linear infinite;
          }
          @keyframes spin-border {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .card {
            position: relative; z-index: 10;
            width: 100%; background: #f8f9ff;
            border-radius: calc(24px - 3px);
            padding: 2.5rem 2rem;
            text-align: center;
            display: flex; flex-direction: column; align-items: center;
          }
          .lottie-wrap { width: 300px; height: 300px; margin: -1rem 0; }
          h1 { font-size: 1.75rem; font-weight: 800; color: #191c20; margin-bottom: 0.5rem; }
          p { font-size: 0.875rem; color: #44474f; margin-bottom: 2rem; max-width: 380px; line-height: 1.7; }
          .btns { display: flex; gap: 0.75rem; flex-wrap: wrap; justify-content: center; }
          .btn-back {
            padding: 0.75rem 1.5rem; border-radius: 9999px;
            font-weight: 700; font-size: 0.875rem;
            color: #191c20; background: rgba(0,0,0,0.07);
            border: none; cursor: pointer;
            display: flex; align-items: center; gap: 0.5rem;
            font-family: inherit;
            transition: background 0.2s ease, transform 0.15s ease;
          }
          .btn-back:hover { background: rgba(0,0,0,0.13); transform: translateX(-2px); }
          .btn-back:active { transform: scale(0.97); }
          .btn-home {
            padding: 0.75rem 1.5rem; border-radius: 9999px;
            font-weight: 700; font-size: 0.875rem;
            color: #fff; background: #1b4086;
            text-decoration: none;
            display: flex; align-items: center; gap: 0.5rem;
            transition: background 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
            box-shadow: 0 4px 14px rgba(27,64,134,0.3);
          }
          .btn-home:hover { background: #163570; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(27,64,134,0.4); }
          .btn-home:active { transform: scale(0.97); }
          .footer-text {
            margin-top: 1.5rem;
            font-size: 0.75rem; color: rgba(0,0,0,0.4);
          }
        `}</style>
      </head>
      <body>
        <div className="border-wrapper">
          <div className="spinner" />
          <div className="card">
            <div className="lottie-wrap">
              <DotLottieReact
                src="/animations/404 error.lottie"
                loop
                autoplay
                renderConfig={{ devicePixelRatio: 2 }}
              />
            </div>
            <h1>{t.title}</h1>
            <p>{t.desc}</p>
            <div className="btns">
              <button className="btn-back" onClick={() => window.history.back()}>
                <FiArrowLeft size={16} /> {t.back}
              </button>
              <Link href="/" className="btn-home">
                <FiHome size={16} /> {t.home}
              </Link>
            </div>
          </div>
        </div>

        <p className="footer-text">
          BEM STMIK Tazkia © {new Date().getFullYear()} - {t.footer}
        </p>
      </body>
    </html>
  );
}
