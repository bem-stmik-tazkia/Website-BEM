"use client";

import React from "react";
import Link from "next/link";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { FiHome, FiArrowLeft } from "react-icons/fi";

export default function RootNotFound() {
  return (
    <html lang="id">
      <body style={{ margin: 0, background: "#f8f9ff", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem 1rem",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Soft background blob */}
          <div
            style={{
              position: "absolute",
              top: "25%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 500,
              height: 500,
              background: "rgba(27,64,134,0.06)",
              borderRadius: "50%",
              filter: "blur(100px)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              maxWidth: 520,
              width: "100%",
              background: "#fff",
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 24,
              padding: "2.5rem 2rem",
              textAlign: "center",
              boxShadow: "0 20px 60px -15px rgba(27,64,134,0.12)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: "relative",
              zIndex: 10,
            }}
          >
            {/* Lottie Animation */}
            <div style={{ width: 240, height: 240, marginBottom: "-1rem" }}>
              <DotLottieReact
                src="/animations/404 error.lottie"
                loop
                autoplay
                renderConfig={{ devicePixelRatio: 2 }}
              />
            </div>

            <h1
              style={{
                fontSize: "1.75rem",
                fontWeight: 800,
                color: "#191c20",
                margin: "0 0 0.5rem",
              }}
            >
              Halaman Tidak Ditemukan
            </h1>

            <p
              style={{
                fontSize: "0.875rem",
                color: "#44474f",
                marginBottom: "2rem",
                maxWidth: 380,
                lineHeight: 1.7,
              }}
            >
              Ups! Halaman yang kamu cari tidak ada atau telah dipindahkan.
              Coba kembali ke halaman utama.
            </p>

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
              <button
                onClick={() => window.history.back()}
                style={{
                  padding: "0.75rem 1.5rem",
                  borderRadius: 9999,
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  color: "#191c20",
                  background: "rgba(0,0,0,0.06)",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <FiArrowLeft size={16} /> Kembali
              </button>

              <Link
                href="/"
                style={{
                  padding: "0.75rem 1.5rem",
                  borderRadius: 9999,
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  color: "#fff",
                  background: "#1b4086",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <FiHome size={16} /> Halaman Utama
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
