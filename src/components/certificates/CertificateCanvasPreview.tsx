"use client";

import React, { useEffect, useRef, useState } from "react";
import type { CertificateRenderData } from "@/types/certificate";
import {
  CERTIFICATE_CANVAS_HEIGHT,
  CERTIFICATE_CANVAS_WIDTH,
  renderCertificateToCanvas,
} from "@/lib/certificate-canvas";

export default function CertificateCanvasPreview({
  data,
  scale = 0.5,
  className = "",
}: {
  data: CertificateRenderData;
  scale?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rendering, setRendering] = useState(true);

  useEffect(() => {
    let active = true;

    const timer = setTimeout(() => {
      if (!canvasRef.current) return;
      setRendering(true);
      renderCertificateToCanvas(data, {
        scale,
        targetCanvas: canvasRef.current,
      })
        .catch((err) => {
          console.warn("[CertificateCanvasPreview] Render failed:", err);
        })
        .finally(() => {
          if (active) setRendering(false);
        });
    }, 60);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [data, scale]);

  return (
    <div
      className={`relative w-full aspect-[2480/1754] rounded-2xl overflow-hidden bg-slate-100 border border-outline-variant/30 shadow-inner ${className}`}
    >
      <canvas
        ref={canvasRef}
        width={Math.round(CERTIFICATE_CANVAS_WIDTH * scale)}
        height={Math.round(CERTIFICATE_CANVAS_HEIGHT * scale)}
        className="w-full h-full block object-contain"
      />
      {rendering && (
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center">
          <span className="px-3 py-1.5 rounded-full bg-surface/90 border border-outline-variant/40 text-xs font-bold text-primary shadow-sm">
            Merender pratinjau...
          </span>
        </div>
      )}
    </div>
  );
}
