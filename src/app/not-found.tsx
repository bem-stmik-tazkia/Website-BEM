"use client";

import React from "react";
import Link from "next/link";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { FiHome, FiArrowLeft } from "react-icons/fi";

export default function RootNotFound() {
  return (
    <html lang="id">
      <head>
        <title>404 - Halaman Tidak Ditemukan | BEM STMIK Tazkia</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            background: #f8f9ff;
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
          .blob-blue {
            position: fixed; top: -60px; left: -60px;
            width: 350px; height: 350px;
            background: rgba(27,64,134,0.15);
            border-radius: 50%; filter: blur(100px);
            pointer-events: none;
          }
          .blob-orange {
            position: fixed; bottom: -50px; right: -50px;
            width: 300px; height: 300px;
            background: rgba(242,121,30,0.15);
            border-radius: 50%; filter: blur(90px);
            pointer-events: none;
          }
          .border-wrapper {
            position: relative;
            width: 100%; max-width: 560px;
            border-radius: 24px;
            padding: 3px;
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
          }
          .btn-home {
            padding: 0.75rem 1.5rem; border-radius: 9999px;
            font-weight: 700; font-size: 0.875rem;
            color: #fff; background: #1b4086;
            text-decoration: none;
            display: flex; align-items: center; gap: 0.5rem;
          }
          .footer-text {
            margin-top: 1.5rem;
            font-size: 0.75rem;
            color: rgba(0,0,0,0.4);
          }
        `}</style>
      </head>
      <body>
        <div className="blob-blue" />
        <div className="blob-orange" />

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
            <h1>Halaman Tidak Ditemukan</h1>
            <p>Ups! Halaman yang kamu cari tidak ada atau telah dipindahkan. Coba kembali ke halaman utama.</p>
            <div className="btns">
              <button className="btn-back" onClick={() => window.history.back()}>
                ← Kembali
              </button>
              <Link href="/" className="btn-home">
                🏠 Halaman Utama
              </Link>
            </div>
          </div>
        </div>

        <p className="footer-text">
          BEM STMIK Tazkia © {new Date().getFullYear()} - Portal Inovasi
        </p>
      </body>
    </html>
  );
}
