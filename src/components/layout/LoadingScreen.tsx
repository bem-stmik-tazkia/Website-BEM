"use client";

import React, { useEffect, useState } from "react";
import LoadingIndicator from "./LoadingIndicator";
import SafeLottie from "@/components/ui/SafeLottie";

export default function LoadingScreen() {
  const [show, setShow] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Gunakan variabel global window untuk melacak soft navigation
    // Jika window.hasSeenLoading sudah true, berarti ini hanya pergantian bahasa atau soft route change
    const globalWindow = window as any;

    if (globalWindow.hasSeenLoading) {
      setShow(false);
    } else {
      globalWindow.hasSeenLoading = true;
      setShow(true);
    }
  }, []);

  useEffect(() => {
    if (!show) return;

    const fallback = setTimeout(() => {
      setIsFading(true);
      setTimeout(() => {
        setShow(false);
      }, 700);
    }, 2000);

    return () => clearTimeout(fallback);
  }, [show]);

  if (!show) return null;

  return (
    <div
      id="page-loader"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-surface dark:bg-[#001235] transition-all duration-700 ${
        isFading ? "opacity-0 scale-[1.05] pointer-events-none" : "opacity-100 scale-100"
      }`}
    >
      <div className="flex flex-col items-center gap-6 animate-init-fade-up">
        <div className="relative flex items-center justify-center mb-4 w-[150px] h-[150px]">
          <SafeLottie src="/animations/lottie-logo.json" autoplay loop={false} className="w-full h-full" />
        </div>

        <div className="mt-2">
          <LoadingIndicator />
        </div>
      </div>
    </div>
  );
}
