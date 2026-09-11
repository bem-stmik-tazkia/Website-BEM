"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import type { DotLottie } from "@lottiefiles/dotlottie-web";

interface SafeLottieProps {
  src: string;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
  style?: React.CSSProperties;
  /** Fallback element if animation fails to load */
  fallback?: React.ReactNode;
}

/**
 * SafeLottie wraps DotLottieReact with:
 * - Client-side only rendering (prevents SSR/hydration mismatch)
 * - Graceful error handling with auto-retry once
 * - Fallback icon when animation permanently fails
 */
export default function SafeLottie({
  src,
  loop = true,
  autoplay = true,
  className,
  style,
  fallback,
}: SafeLottieProps) {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const retryAttempted = useRef(false);

  useEffect(() => {
    // Small delay to avoid Turbopack dev server race condition on first render
    const timer = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(timer);
  }, []);

  const handleRef = useCallback(
    (dotLottie: DotLottie | null) => {
      if (!dotLottie) return;

      const onError = () => {
        if (!retryAttempted.current) {
          retryAttempted.current = true;
          // Retry once after a short delay
          setTimeout(() => setRetryKey((k) => k + 1), 900);
        } else {
          setError(true);
        }
      };

      dotLottie.addEventListener("loadError", onError);
      return () => {
        dotLottie.removeEventListener("loadError", onError);
      };
    },
    []
  );

  if (!mounted || error) {
    return (
      <div
        className={className}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          ...style,
        }}
      >
        {fallback || <CalendarFallback />}
      </div>
    );
  }

  return (
    <DotLottieReact
      key={retryKey}
      src={src}
      loop={loop}
      autoplay={autoplay}
      className={className}
      style={style}
      dotLottieRefCallback={handleRef}
    />
  );
}

function CalendarFallback() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="56"
      height="56"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: "var(--color-primary, #1b4086)", opacity: 0.35 }}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
