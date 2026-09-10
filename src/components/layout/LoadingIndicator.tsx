"use client";

import React from "react";

export default function LoadingIndicator() {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[15px] font-medium text-[#191c20] dark:text-white/90 tracking-wide font-sans">
        Loading
      </span>
      <div className="flex items-center gap-1.5 pt-0.5">
        <div className="loading-dot"></div>
        <div className="loading-dot"></div>
        <div className="loading-dot"></div>
      </div>
      <style href="loading-indicator" precedence="default" dangerouslySetInnerHTML={{ __html: `
        .loading-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: var(--color-secondary, #f2791e);
          animation: pulseDot 1.5s infinite ease-in-out both;
        }

        .loading-dot:nth-child(1) {
          animation-delay: -0.4s;
        }

        .loading-dot:nth-child(2) {
          animation-delay: -0.2s;
        }

        .loading-dot:nth-child(3) {
          animation-delay: 0s;
        }

        @keyframes pulseDot {
          0%, 80%, 100% {
            transform: scale(1);
            background-color: var(--color-secondary, #f2791e);
          }
          40% {
            transform: scale(1.6);
            background-color: var(--color-primary, #1b4086);
          }
        }
      `}} />
    </div>
  );
}
