"use client";

import React, { useEffect, useState, useRef } from "react";
import LoadingIndicator from "./LoadingIndicator";

export default function LoadingScreen() {
  const [show, setShow] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    // Check if user already saw loading screen during this session
    const isNavigating = typeof window !== "undefined" && window.performance?.getEntriesByType("navigation")[0] as any;
    const isReload = isNavigating?.type === "reload";
    const hasSeen = sessionStorage.getItem("hasSeenLoading");

    if (hasSeen && !isReload) {
      // Already seen, skip loading screen
      setShow(false);
    } else {
      sessionStorage.setItem("hasSeenLoading", "true");
      setShow(true);

      // Load lottie-player script dynamically if not already loaded
      if (!document.getElementById("lottie-player-script")) {
        const script = document.createElement("script");
        script.id = "lottie-player-script";
        script.src = "https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js";
        script.async = true;
        document.body.appendChild(script);
      }
    }
  }, []);

  useEffect(() => {
    if (!show) return;

    const handleComplete = () => {
      setIsFading(true);
      setTimeout(() => {
        setShow(false);
      }, 700); // match transition duration
    };

    const player = playerRef.current;
    if (player) {
      player.addEventListener("complete", handleComplete);
    }

    // Safety fallback timeout if Lottie fails or takes too long
    const fallback = setTimeout(() => {
      setIsFading(true);
      setTimeout(() => {
        setShow(false);
      }, 700);
    }, 2500);

    return () => {
      if (player) {
        player.removeEventListener("complete", handleComplete);
      }
      clearTimeout(fallback);
    };
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
        <div className="relative flex items-center justify-center mb-4">
          {React.createElement("lottie-player", {
            ref: playerRef,
            id: "lottie-logo",
            src: "/animations/lottie-logo.json",
            background: "transparent",
            speed: "1",
            style: { width: "150px", height: "150px" },
            autoplay: true,
          })}
        </div>

        <div className="mt-2">
          <LoadingIndicator />
        </div>
      </div>
    </div>
  );
}
